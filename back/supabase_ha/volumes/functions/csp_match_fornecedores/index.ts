// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/* =====================================================
   ENV — SUPABASE SELF HOSTED / HA
===================================================== */
const PROJECT_URL = Deno.env.get("PROJECT_URL");           // http://kong:8000
const INTERNAL_AUTH_URL = Deno.env.get("INTERNAL_AUTH_URL"); // http://auth:9999
const ANON_KEY = Deno.env.get("ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

/* =====================================================
   CORS
===================================================== */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

/* =====================================================
   AUTH — GOTRUE INTERNO
===================================================== */
async function getUserFromJWT(authHeader: string) {
  if (!authHeader) return null;

  const res = await fetch(`${INTERNAL_AUTH_URL}/user`, {
    headers: { Authorization: authHeader },
  });

  if (!res.ok) return null;
  return await res.json();
}

/* =====================================================
   SUPABASE CLIENTS
===================================================== */
function supaUserClient(authHeader: string) {
  return createClient(PROJECT_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
}

function supaAdminClient() {
  return createClient(PROJECT_URL, SERVICE_ROLE_KEY);
}

/* =====================================================
   UTILIDADES DE TEMPO
===================================================== */
function buildDateTime(date: string, time: string) {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${normalizedTime}`);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

/* =====================================================
   EDGE FUNCTION — CSP
===================================================== */
serve(async (req) => {
  try {
    /* ================= CORS ================= */
    if (req.method === "OPTIONS")
      return new Response("ok", { headers: corsHeaders });

    if (req.method !== "POST")
      return json({ error: "Use POST" }, 405);

    /* ================= AUTH ================= */
    const authHeader = req.headers.get("Authorization") || "";
    const user = await getUserFromJWT(authHeader);

    if (!user?.id)
      return json({ error: "Não autenticado" }, 401);

    // (Opcional) se quiseres limitar a admins, valida aqui
    // const supaUser = supaUserClient(authHeader);

    /* ================= BODY ================= */
    const bodyText = await req.text();
    if (!bodyText) return json({ solutions: [] });

    const { pedido_id, max_solutions = 5 } = JSON.parse(bodyText);

    if (!pedido_id)
      return json({ solutions: [] });

    const supabase = supaAdminClient();

    /* =====================================================
       1️⃣ CARREGAR PEDIDO
    ===================================================== */
    const { data: pedido } = await supabase
      .from("pedido")
      .select("id,categoria,data_prevista,hora_prevista,orcamento_max")
      .eq("id", pedido_id)
      .single();

    if (
      !pedido ||
      !pedido.categoria ||
      !pedido.data_prevista ||
      !pedido.hora_prevista
    ) {
      return json({ solutions: [] });
    }

    const pedidoInicio = buildDateTime(
      pedido.data_prevista,
      pedido.hora_prevista
    );

    const pedidoFim = addMinutes(pedidoInicio, 60);

    /* =====================================================
       2️⃣ DOMÍNIOS
    ===================================================== */
    const { data: fornecedores } = await supabase
      .from("fornecedor")
      .select("id,nome,email,telefone,avaliacao_media")
      .eq("disponibilidade", true);

    if (!fornecedores || fornecedores.length === 0)
      return json({ solutions: [] });

    const fornecedorIds = fornecedores.map((f: any) => f.id);

    const { data: servicos } = await supabase
      .from("fornecedor_servico")
      .select("id,fornecedor_id,tipo_servico,preco_medio")
      .in("fornecedor_id", fornecedorIds)
      .eq("tipo_servico", pedido.categoria);

    const { data: slots } = await supabase
      .from("fornecedor_slot")
      .select("id,fornecedor_id,inicio,fim")
      .in("fornecedor_id", fornecedorIds)
      .eq("status", "livre");

    /* =====================================================
       3️⃣ INDEXAÇÃO
    ===================================================== */
    const servicosPorFornecedor = new Map<string, any[]>();
    for (const s of servicos ?? []) {
      if (!servicosPorFornecedor.has(s.fornecedor_id))
        servicosPorFornecedor.set(s.fornecedor_id, []);
      servicosPorFornecedor.get(s.fornecedor_id)!.push(s);
    }

    const slotsPorFornecedor = new Map<string, any[]>();
    for (const z of slots ?? []) {
      if (!slotsPorFornecedor.has(z.fornecedor_id))
        slotsPorFornecedor.set(z.fornecedor_id, []);
      slotsPorFornecedor.get(z.fornecedor_id)!.push(z);
    }

    /* =====================================================
       4️⃣ CSP COM BACKTRACKING
       X1 = Fornecedor
       X2 = Serviço
       X3 = Slot
    ===================================================== */
    const solutions: any[] = [];

    function backtrackFornecedor(idx: number) {
      if (solutions.length >= max_solutions) return;
      if (idx >= fornecedores.length) return;

      const fornecedor = fornecedores[idx];
      const servs = servicosPorFornecedor.get(fornecedor.id) ?? [];
      const slotsF = slotsPorFornecedor.get(fornecedor.id) ?? [];

      for (const servico of servs) {
        if (
          pedido.orcamento_max != null &&
          servico.preco_medio != null &&
          servico.preco_medio > pedido.orcamento_max
        )
          continue;

        for (const slot of slotsF) {
          const slotInicio = new Date(slot.inicio);
          const slotFim = new Date(slot.fim);

          const intersecta =
            slotInicio < pedidoFim &&
            slotFim > pedidoInicio;

          if (!intersecta) continue;

          const score = (fornecedor.avaliacao_media ?? 0) / 5;

          solutions.push({
            fornecedor_id: fornecedor.id,
            fornecedor_nome: fornecedor.nome,
            fornecedor_email: fornecedor.email,
            fornecedor_telefone: fornecedor.telefone,
            avaliacao_media: fornecedor.avaliacao_media,

            servico_id: servico.id,
            tipo_servico: servico.tipo_servico,
            preco_medio: servico.preco_medio,

            slot_id: slot.id,
            slot_inicio: slot.inicio,
            slot_fim: slot.fim,

            score,
          });

          if (solutions.length >= max_solutions) return;
        }
      }

      backtrackFornecedor(idx + 1);
    }

    backtrackFornecedor(0);

    /* =====================================================
       5️⃣ ORDENAR
    ===================================================== */
    solutions.sort((a, b) => b.score - a.score);

    return json({ solutions });

  } catch (e) {
    console.error("CSP error:", e);
    return json({ error: "Erro ao executar CSP" }, 500);
  }
});
