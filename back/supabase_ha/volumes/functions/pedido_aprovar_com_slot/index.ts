// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/* =====================================================
   ENV (SUPABASE SELF-HOSTED / HA)
===================================================== */
const PROJECT_URL = Deno.env.get("PROJECT_URL"); // http://kong:8000
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
   AUTH — GOTRUE INTERNO (OBRIGATÓRIO EM HA)
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
   MAIN
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

    /* ================= BODY ================= */
    const bodyText = await req.text();
    if (!bodyText)
      return json({ error: "Body vazio." }, 400);

    const body = JSON.parse(bodyText);
    const { pedido_id, slot_id, resposta } = body ?? {};

    if (!pedido_id || !slot_id || !resposta)
      return json(
        { error: "pedido_id, slot_id e resposta são obrigatórios." },
        400,
      );

    const supaAdmin = supaAdminClient();

    /* =====================================================
       1️⃣ RESERVAR SLOT (ATÔMICO)
       Só funciona se ainda estiver LIVRE
    ===================================================== */
    const { error: slotErr, count } = await supaAdmin
      .from("fornecedor_slot")
      .update({
        status: "reservado",
        pedido_id,
      })
      .eq("id", slot_id)
      .eq("status", "livre");

    if (slotErr)
      return json({ error: slotErr.message }, 500);

    if (count !== 1)
      return json(
        { error: "Slot não está disponível." },
        409,
      );

    /* =====================================================
       2️⃣ APROVAR PEDIDO
    ===================================================== */
    const { error: pedidoErr } = await supaAdmin
      .from("pedido")
      .update({
        estado_pedido: "aprovado",
        resposta,
      })
      .eq("id", pedido_id);

    if (pedidoErr)
      return json({ error: pedidoErr.message }, 500);

    /* ================= OK ================= */
    return json({ success: true });

  } catch (e) {
    console.error("Erro ao aprovar pedido:", e);
    return json(
      { error: e?.message ?? "Erro interno." },
      500,
    );
  }
});
