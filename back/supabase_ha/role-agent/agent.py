import os
import socket
import psycopg2

DSN = os.getenv("DSN")
PORT = int(os.getenv("PORT", "9100"))

def check_role():
    try:
        conn = psycopg2.connect(DSN, connect_timeout=2)
        cur = conn.cursor()
        cur.execute("SELECT pg_is_in_recovery();")
        (in_recov,) = cur.fetchone()
        cur.close()
        conn.close()
        return "up\n" if not in_recov else "down\n"
    except Exception:
        return "down\n"

def serve():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(("0.0.0.0", PORT))
    s.listen(128)
    while True:
        conn, _ = s.accept()
        try:
            status = check_role()
            conn.sendall(status.encode("ascii"))
        finally:
            conn.close()

if __name__ == "__main__":
    serve()
