import os
import time
import psycopg2
import psycopg2.extras
import sys

PRIMARY_DSN = os.getenv("PRIMARY_DSN")
REPLICA_DSN = os.getenv("REPLICA_DSN")

CHECK_INTERVAL = int(os.getenv("CHECK_INTERVAL", "5"))
FAILURE_THRESHOLD = int(os.getenv("FAILURE_THRESHOLD", "3"))

def log(msg):
    print(f"[pg-failover-watcher] {msg}", flush=True)

def check_primary_alive():
    """Retorna True se a primary responder SELECT 1."""
    try:
        conn = psycopg2.connect(PRIMARY_DSN, connect_timeout=2)
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.fetchone()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        log(f"Primary check FAILED: {e}")
        return False

def is_replica_in_recovery():
    """True se a réplica ainda está em recovery (ou seja, ainda é standby)."""
    try:
        conn = psycopg2.connect(REPLICA_DSN, connect_timeout=5)
        cur = conn.cursor()
        cur.execute("SELECT pg_is_in_recovery();")
        (in_recov,) = cur.fetchone()
        cur.close()
        conn.close()
        return in_recov
    except Exception as e:
        log(f"Erro ao verificar pg_is_in_recovery() na réplica: {e}")
        # Se não consegui nem conectar, assumo que NÃO posso promover ainda
        return True

def promote_replica():
    """Chama pg_promote() na réplica."""
    try:
        conn = psycopg2.connect(REPLICA_DSN, connect_timeout=5)
        conn.autocommit = True
        cur = conn.cursor()
        log("Chamando pg_promote() na réplica...")
        # wait = true para bloquear até concluir (dentro do possível)
        cur.execute("SELECT pg_promote(wait => true);")
        (res,) = cur.fetchone()
        log(f"pg_promote() retornou: {res}")
        cur.close()
        conn.close()
    except Exception as e:
        log(f"FALHA ao promover réplica: {e}")
        raise

def wait_until_promoted(timeout=30):
    """Espera até a réplica sair de recovery, ou estoura timeout."""
    start = time.time()
    while time.time() - start < timeout:
        in_recovery = is_replica_in_recovery()
        if not in_recovery:
            log("Réplica saiu de recovery — agora é PRIMARY 🎉")
            return True
        time.sleep(1)
    log("Timeout esperando a réplica sair de recovery.")
    return False

def do_failover():
    log("⚠️  FAILOVER DISPARADO: primary parece fora do ar.")
    # 1) Ver se a réplica ainda é réplica (em recovery)
    if not is_replica_in_recovery():
        log("Réplica já não está em recovery (provavelmente já é primary). Nada a fazer.")
        return

    # 2) Tentar promover
    try:
        promote_replica()
    except Exception:
        log("Erro na promoção da réplica. Abortando tentativa de failover.")
        return

    # 3) Esperar sair de recovery
    if not wait_until_promoted():
        log("Falha ao confirmar promoção. Verifique manualmente a réplica.")
        return

    log("✅ Failover concluído. A antiga réplica agora é PRIMARY.")

def main():
    if not PRIMARY_DSN or not REPLICA_DSN:
        log("ERRO: PRIMARY_DSN ou REPLICA_DSN não definidos.")
        sys.exit(1)

    log(f"Watcher iniciado. CHECK_INTERVAL={CHECK_INTERVAL}s, FAILURE_THRESHOLD={FAILURE_THRESHOLD} falhas.")
    failure_count = 0

    while True:
        alive = check_primary_alive()
        if alive:
            if failure_count > 0:
                log("Primary respondeu novamente. Resetando contador de falhas.")
            failure_count = 0
        else:
            failure_count += 1
            log(f"Falha consecutiva #{failure_count} ao checar a primary.")
            if failure_count >= FAILURE_THRESHOLD:
                do_failover()
                # Depois do failover, não faz sentido continuar monitorando como se ainda houvesse primary original.
                log("Encerrando watcher após o failover. (Reinicie o container se quiser monitorar novamente.)")
                break

        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
