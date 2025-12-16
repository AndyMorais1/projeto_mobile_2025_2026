FROM python:3.12-slim
RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client && \
    pip install --no-cache-dir psycopg2-binary && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY agent.py /app/agent.py
ENV PORT=9100
CMD ["python", "/app/agent.py"]
