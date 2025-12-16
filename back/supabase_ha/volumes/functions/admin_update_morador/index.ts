// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

/**
 * Edge Function: admin_update_morador (SUPABASE HA READY)
 *
 * - Valida o JWT via GoTrue interno: INTERNAL_AUTH_URL=/user
 * - Usa PROJECT_URL + SERVICE_ROLE_KEY para atualizar Auth + tabela morador
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// =====================================================
// ENV
// =====================================================
const PROJECT_URL = Deno.env.get("PROJECT_URL");             // ex: http://kong:8000
const INTERNAL_AUTH_URL = Deno.env.get("INTERNAL_AUTH_URL"); // ex: http://auth:9999
const ANON_KEY = Deno.env.get("ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

if (!PROJECT_URL) console.error("[CONFIG] PROJECT_URL não definido");
if (!INTERNAL_AUTH_URL) console.error("[CONFIG] INTERNAL_AUTH_URL não definido");
if (!ANON_KEY) console.error("[CONFIG] ANON_KEY não definido");
if (!SERVICE_ROLE_KEY) console.error("[CONFIG] SERVICE_ROLE_KEY não definido");

// =====================================================
// CORS
// =====================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
      "authorization, content-type, apikey, x-client-info, x-requested-with",
  "Content-Type": "application/json; charset=utf-8",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

// =====================================================
// AUTH — valida JWT via /user no serviço auth interno
// =====================================================
async function getUserFromJWT(authHeader: string) {
  try {
    if (!authHeader) {
      console.log("[AUTH] Sem Authorization header");
      return null;
    }

    const url = `${INTERNAL_AUTH_URL}/user`;
    console.log("[AUTH] A chamar", url);

    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.log("[AUTH] Falhou:", res.status, txt);
      return null;
    }

    const raw = await res.json();
    console.log("[AUTH] RAW USER RESPONSE:", raw);

    // 🔥 Normalização:
    // - Se vier no formato { user: {...} }, usa direto
    // - Se vier "nu" (tem id no topo), embrulha em { user: raw }
    if (raw?.user) {
      console.log("[AUTH] OK (wrapped), user id:", raw.user.id);
      return raw;
    }

    if (raw?.id) {
      console.log("[AUTH] OK (bare), user id:", raw.id);
      return { user: raw };
    }

    console.log("[AUTH] Resposta sem user/id");
    return null;
  } catch (e) {
    console.error("[AUTH ERROR]", e);
    return null;
  }
}


// =====================================================
// SUPABASE CLIENTS
// =====================================================
function supaUserClient(authHeader: string) {
  return createClient(PROJECT_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
}

function supaAdminClient() {
  return createClient(PROJECT_URL, SERVICE_ROLE_KEY);
}

// =====================================================
// MAIN HANDLER
// =====================================================
serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return json({ error: "Use POST" }, 405);
    }

    // -------------------------------------------------
    // 1) JWT vindo do frontend
    // -------------------------------------------------
    const authHeader = req.headers.get("Authorization") || "";
    console.log("[INFO] AUTH HEADER RECEBIDO:", authHeader);

    const authData = await getUserFromJWT(authHeader);

    if (!authData?.user) {
      console.log("[INFO] JWT inválido");
      return json({ error: "Não autenticado" }, 401);
    }

    const loggedUserId = authData.user.id;

    // -------------------------------------------------
    // 2) Verificar se o utilizador logado é ADMIN ativo
    // -------------------------------------------------
    const supaUser = supaUserClient(authHeader);

    const { data: adminRow, error: adminErr } = await supaUser
        .from("admin")
        .select("id, estado_utilizador")
        .eq("id", loggedUserId)
        .single();

    if (adminErr || !adminRow) {
      console.log("[ADMIN] Não é admin:", adminErr);
      return json({ error: "Acesso negado (não é admin)" }, 403);
    }

    if (adminRow.estado_utilizador !== "ativo") {
      console.log("[ADMIN] Admin inativo:", adminRow.estado_utilizador);
      return json({ error: "Acesso negado (admin inativo)" }, 403);
    }

    // -------------------------------------------------
    // 3) BODY
    // -------------------------------------------------
    const body = await req.json().catch(() => ({}));
    const {
      user_id,
      nome,
      email,
      telefone,
      bi,
      foto,
      estado_utilizador,
    } = body ?? {};

    console.log("[BODY]", body);

    if (!user_id || !nome || !email) {
      return json(
          { error: "Campos obrigatórios: user_id, nome, email" },
          400,
      );
    }

    const supaAdmin = supaAdminClient();

    // -------------------------------------------------
    // 4) UPDATE no AUTH
    // -------------------------------------------------
    const { error: authErr } = await supaAdmin.auth.admin.updateUserById(
        user_id,
        {
          email,
          user_metadata: {
            name: nome,
            phone: telefone ?? null,
            bi: bi ?? null,
            picture: foto ?? null,
            estado_utilizador: estado_utilizador ?? "pendente",
          },
        },
    );

    if (authErr) {
      console.error("[AUTH UPDATE ERROR]", authErr);
      return json({ error: "Erro ao atualizar utilizador no Auth" }, 400);
    }

    // -------------------------------------------------
    // 5) UPDATE na tabela morador
    // -------------------------------------------------
    const { error: updErr } = await supaAdmin
        .from("morador")
        .update({
          nome,
          email,
          telefone: telefone ?? null,
          bi: bi ?? null,
          foto: foto ?? null,
          estado_utilizador: estado_utilizador ?? "pendente",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user_id);

    if (updErr) {
      console.error("[DB UPDATE ERROR]", updErr);
      return json({
        error: "Erro ao atualizar morador: " + updErr.message,
      }, 400);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("ERRO ADMIN_UPDATE_MORADOR:", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});
