#!/bin/bash

# ---------- COLORS ----------
GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m" # No color

echo -e "${RED}🛑 Parando Supabase...${NC}"
supabase stop

echo -e "${RED}🛑 Matando Stripe Listener...${NC}"
pkill -f "stripe listen" >/dev/null 2>&1

echo -e "${RED}🛑 Matando Edge Functions...${NC}"
pkill -f "supabase functions serve" >/dev/null 2>&1

echo -e "${GREEN}✔ Tudo parado com sucesso!${NC}"
