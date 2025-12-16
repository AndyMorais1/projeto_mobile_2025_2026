#!/bin/bash

PROJECT_URL="https://zjcnswsmrfqzrkgvlixa.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqY25zd3NtcmZxenJrZ3ZsaXhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQyODE5NywiZXhwIjoyMDc1MDA0MTk3fQ.OqNou26580b3a5kE7B-Tf0wr-e-wg84zp7vlOHFmrL8"

BUCKETS=("user_fotos" "info_fotos" "recibos" "info_anexos")

OUT_DIR="./cloud_storage"
mkdir -p "$OUT_DIR"

for bucket in "${BUCKETS[@]}"; do
  echo "📦 Baixando bucket: $bucket"

  mkdir -p "$OUT_DIR/$bucket"

  # LISTAR ARQUIVOS CORRETAMENTE (POST + JSON)
  files=$(curl -s \
    -X POST \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{"prefix": ""}' \
    "$PROJECT_URL/storage/v1/object/list/$bucket" \
    | jq -r '.[].name')

  echo "$files" | while read -r file; do
    [ -z "$file" ] && continue

    echo "  ⬇️  Baixando: $file"

    mkdir -p "$OUT_DIR/$bucket/$(dirname "$file")"

    curl -s \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
      "$PROJECT_URL/storage/v1/object/$bucket/$file" \
      -o "$OUT_DIR/$bucket/$file"
  done
done

echo "✅ Download completo!"
