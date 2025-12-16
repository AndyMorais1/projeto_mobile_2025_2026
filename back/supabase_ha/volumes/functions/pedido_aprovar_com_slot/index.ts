// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/* =====================================================
   ENV (SELF HOSTED / HA)
===================================================== */
const PROJECT_URL = Deno.env.get("PROJECT_URL"); // ex: http://kong:8000
const INTERNAL_AUTH_URL = Deno.env.get("INTERNAL_AUTH_URL"); // ex: http://auth:9999
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
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

/* =====================================================
   AUTH — validar JWT no GoTrue interno (HA fix)
===================================================== */
async function getUserFromJWT(authHeader: string) {
  try {
    if (!authHeader) return null;

    const res = await fetch(`${INTERNAL_AUTH_URL}/user`, {
      method: "GET",
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.log("[AUTH] invalid:", res.status, body);
      return null;
    }

    return await res.json();
  } catch (e) {
    console.error("[AUTH ERROR]", e);
    return null;
  }
}

/* =====================================================
   CLIENTS
===================================================== */
function supaUserClient(authHeader: string) {
  return createClient(PROJECT_URL!, ANON_KEY!, {
    global: { headers: { Authorization: authHeader } },
  });
}

function supaAdminClient() {
  return createClient(PROJECT_URL!, SERVICE_ROLE_KEY!);
}

/* =====================================================
   MAIN
===================================================== */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    /* ---------------- JWT ---------------- */
    const authHeader = req.headers.get("Authorization") || "";
    const userData = await getUserFromJWT(authHeader);

    if (!userData?.id) {
      return json({ error: "Não autenticado" }, 401);
    }

    const userId = userData.id;

    /* ---------------- validar admin (opcional mas recomendado) ---------------- */
    // Se não quiseres validar admin, podes remover este bloco.
    const supaUser = supaUserClient(authHeader);

    const { data: adminRow, error: adminErr } = await supaUser
      .from("admin")
      .select("id, estado_utilizador")
      .eq("id", userId)
      .single();

    if (adminErr || !adminRow) return json({ error: "Acesso negado (não é admin)" }, 403);
    if (adminRow.estado_utilizador !== "ativo") return json({ error: "Acesso negado (admin inativo)" }, 403);

    /* ---------------- body seguro ---------------- */
    const text = await req.text();
    if (!text) return json({ error: "Body vazio." }, 400);

    let payload: any = {};
    try {
      payload = JSON.parse(text);
    } catch {
      return json({ error: "JSON inválido." }, 400);
    }

    const { pedido_id, slot_id, resposta } = payload ?? {};
    if (!pedido_id || !slot_id || !resposta) {
      return json({ error: "Parâmetros inválidos: pedido_id, slot_id, resposta" }, 400);
    }

    console.log("[pedido_aprovar_com_slot] request:", {
      pedido_id,
      slot_id,
      admin_id: adminRow.id,
      ts: new Date().toISOString(),
    });

    const supaAdmin = supaAdminClient();

    /* =====================================================
       1) VERIFICAR PEDIDO (IDEMPOTÊNCIA)
    ===================================================== */
    const { data: pedido, error: pedidoFetchErr } = await supaAdmin
      .from("pedido")
      .select("id, estado_pedido")
      .eq("id", pedido_id)
      .single();

    if (pedidoFetchErr || !pedido) {
      return json({ error: "Pedido não encontrado." }, 404);
    }

    // ✅ idempotente: se já estiver aprovado, não dá 409
    if (pedido.estado_pedido === "aprovado") {
      return json({ ok: true, alreadyApproved: true }, 200);
    }

    /* =====================================================
       2) RESERVAR SLOT (ATÓMICO)
       Só reserva se ainda estiver livre.
       ✅ isto é o que garante concorrência
    ===================================================== */
    const { data: updatedSlot, error: slotUpdateErr } = await supaAdmin
      .from("fornecedor_slot")
      .update({
        status: "reservado", // enum correto: livre|reservado|bloqueado
        pedido_id,
      })
      .eq("id", slot_id)
      .eq("status", "livre")
      .select("id, fornecedor_id, status")
      .maybeSingle();

    // Se não atualizou nada → já não estava livre
    if (slotUpdateErr || !updatedSlot) {
      return json({ error: "Slot indisponível." }, 409);
    }

    /* =====================================================
       3) APROVAR PEDIDO
       (se quiseres também guardar fornecedor_id, dá para usar updatedSlot.fornecedor_id)
    ===================================================== */
    const { error: pedidoUpdateErr } = await supaAdmin
      .from("pedido")
      .update({
        estado_pedido: "aprovado",
        resposta,
        // fornecedor_id: updatedSlot.fornecedor_id, // opcional (se existir coluna)
      })
      .eq("id", pedido_id);

    if (pedidoUpdateErr) throw pedidoUpdateErr;

    return json({ ok: true, slot_id: updatedSlot.id }, 200);
  } catch (e: any) {
    console.error("[pedido_aprovar_com_slot] ERRO:", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});
