FROM python:3.12-slim

# Instala cliente do Postgres e driver Python
RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client && \
    pip install --no-cache-dir psycopg2-binary && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY failover.py /app/failover.py

CMD ["python", "/app/failover.py"]
