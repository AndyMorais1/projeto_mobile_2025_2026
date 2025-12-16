// supabase/functions/admin_delete_morador/index.ts
// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/* =====================================================
   ENV NECESSÁRIAS (vêm do docker-compose)
===================================================== */
const PROJECT_URL = Deno.env.get("PROJECT_URL");          // http://kong:8000
const INTERNAL_AUTH_URL = Deno.env.get("INTERNAL_AUTH_URL"); // http://auth:9999
const ANON_KEY = Deno.env.get("ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

/* =====================================================
   CORS
===================================================== */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
      "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

/* =====================================================
   AUTH — VALIDA JWT usando AUTH INTERNO
===================================================== */
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Use POST" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    console.log("AUTH HEADER:", authHeader);

    /* --- 1) VALIDAR JWT --- */
    const authData = await getUserFromJWT(authHeader);
    if (!authData?.user) {
      return json({ error: "Não autenticado" }, 401);
    }

    const loggedUserId = authData.user.id;

    /* --- 2) Verificar se é ADMIN --- */
    const supaUser = supaUserClient(authHeader);

    const { data: adminRow, error: adminErr } = await supaUser
        .from("admin")
        .select("id, estado_utilizador")
        .eq("id", loggedUserId)
        .single();

    if (adminErr || !adminRow)
      return json({ error: "Acesso negado (não é admin)" }, 403);

    if (adminRow.estado_utilizador !== "ativo")
      return json({ error: "Admin inativo" }, 403);

    /* --- 3) BODY --- */
    const body = await req.json().catch(() => ({}));
    const { user_id } = body;

    if (!user_id)
      return json({ error: "user_id é obrigatório" }, 400);

    const supaAdmin = supaAdminClient();

    /* --- 4) Libertar propriedades --- */
    const { error: propErr } = await supaAdmin
        .from("propriedade")
        .update({
          morador_id: null,
          estado_propriedade: "disponivel",
          updated_at: new Date().toISOString(),
        })
        .eq("morador_id", user_id);

    if (propErr) throw propErr;

    /* --- 5) Apagar da tabela morador --- */
    const { error: delErr } = await supaAdmin
        .from("morador")
        .delete()
        .eq("id", user_id);

    if (delErr) throw delErr;

    /* --- 6) Remover no AUTH --- */
    const { error: authDelErr } = await supaAdmin.auth.admin.deleteUser(user_id);
    if (authDelErr) throw authDelErr;

    return json({ ok: true });
  } catch (e) {
    console.error("ERRO ADMIN_DELETE_MORADOR:", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});
