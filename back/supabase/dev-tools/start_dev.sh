#!/bin/bash

# ---------- COLORS ----------
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No color

echo -e "${YELLOW}🟡 Parando qualquer serviço Supabase rodando...${NC}"
supabase stop >/dev/null 2>&1

echo -e "${BLUE}🟢 Iniciando Supabase...${NC}"
supabase start

echo -e "${GREEN}🟣 Subindo Edge Functions com env...${NC}"
supabase functions serve --env-file .env &
PID_FUNCS=$!

# Verifica se Stripe está instalado
if command -v stripe &> /dev/null
then
  echo -e "${BLUE}💳 Iniciando Stripe Webhook Listener...${NC}"
  stripe listen --forward-to http://localhost:54321/functions/v1/stripe_webhook &
  PID_STRIPE=$!
else
  echo -e "${RED}⚠️ Stripe CLI não encontrado. Pulei o Stripe Listener.${NC}"
  PID_STRIPE="N/A"
fi

echo ""
echo -e "${GREEN}🚀 Ambiente de desenvolvimento iniciado!${NC}"
echo "---------------------------------------------"
echo "Supabase API:      http://localhost:54321"
echo "Supabase Studio:   http://localhost:54323"
echo "Functions PID:     $PID_FUNCS"
echo "Stripe Listener:   $PID_STRIPE"
echo "---------------------------------------------"
echo ""
echo "📌 Para parar tudo: ./dev-tools/stop_dev.sh"
echo ""
