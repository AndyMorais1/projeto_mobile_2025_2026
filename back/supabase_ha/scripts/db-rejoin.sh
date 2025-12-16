#!/bin/sh
set -e

PRIMARY_HOST="${PRIMARY_HOST_CANDIDATE:-supabase-db-replica}"
DATA_DIR="/var/lib/postgresql/data"

export PGPASSWORD="${POSTGRES_PASSWORD}"

chown -R postgres:postgres "${DATA_DIR}"

REMOTE_READY=0
I=0
while [ $I -lt 20 ]; do
  if pg_isready -h "${PRIMARY_HOST}" -p 5432 -U supabase_admin >/dev/null 2>&1; then
    REMOTE_READY=1
    break
  fi
  I=$((I+1))
  sleep 2
done

if [ "${REMOTE_READY}" = "1" ]; then
  RES=`psql -At -h "${PRIMARY_HOST}" -p 5432 -U supabase_admin -d postgres -c 'select not pg_is_in_recovery();' 2>/dev/null || true`
else
  RES=""
fi

if [ "${REJOIN_ON_START}" = "1" ]; then
  if [ ! -f "${DATA_DIR}/standby.signal" ]; then
    if [ "${REMOTE_READY}" = "1" ] && [ "${RES}" = "t" ]; then
      echo "[db-rejoin] Remote is PRIMARY and ready. Performing basebackup from ${PRIMARY_HOST}..."
      rm -rf "${DATA_DIR}"/*
      su -s /bin/sh -c "PGSSLMODE=disable PGPASSWORD=${POSTGRES_PASSWORD} pg_basebackup \
        -h ${PRIMARY_HOST} -p 5432 -U supabase_admin -D ${DATA_DIR} -R" postgres
      echo "[db-rejoin] Basebackup completed."
    elif [ ! -f "${DATA_DIR}/PG_VERSION" ]; then
      echo "[db-rejoin] Data dir empty; deferring to docker-entrypoint init."
      exec /usr/local/bin/docker-entrypoint.sh postgres
    else
      echo "[db-rejoin] Skipping rejoin: remote_ready=${REMOTE_READY} res=${RES} data_dir_has_pg_version"
    fi
  fi
fi
exit 0
