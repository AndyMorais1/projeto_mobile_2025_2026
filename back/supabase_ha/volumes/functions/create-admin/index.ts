// supabase/functions/create-admin/index.ts
// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/* =====================================================
   ENV
===================================================== */
const PROJECT_URL = Deno.env.get("PROJECT_URL");              // http://kong:8000
const INTERNAL_AUTH_URL = Deno.env.get("INTERNAL_AUTH_URL");  // http://auth:9999
const ANON_KEY = Deno.env.get("ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "no-reply@onresend.com";

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
   AUTH — Valida JWT via AUTH interno (GoTrue)
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

function usernameFromEmail(email: string) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

/* =====================================================
   Email
===================================================== */
async function sendResendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
  });

  if (!res.ok) throw new Error(await res.text());
}

/* =====================================================
   MAIN
===================================================== */
serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return json({ error: "Use POST" }, 405);
    }

    /* --------------------------------------------------
       1) Validar JWT via GoTrue interno (HA OK)
    -------------------------------------------------- */
    const authHeader = req.headers.get("Authorization") || "";
    console.log("AUTH HEADER:", authHeader);

    const authData = await getUserFromJWT(authHeader);
    if (!authData?.user) return json({ error: "Não autenticado" }, 401);

    const loggedUserId = authData.user.id;

    /* --------------------------------------------------
       2) Verificar Admin + ativo + super admin
    -------------------------------------------------- */
    const supaUser = supaUserClient(authHeader);

    const { data: adminRow, error: adminErr } = await supaUser
        .from("admin")
        .select("id, estado_utilizador, is_super")
        .eq("id", loggedUserId)
        .single();

    if (adminErr || !adminRow)
      return json({ error: "Acesso negado (não é admin)" }, 403);

    if (adminRow.estado_utilizador !== "ativo")
      return json({ error: "Acesso negado (admin inativo)" }, 403);

    if (!adminRow.is_super)
      return json({ error: "Acesso negado (apenas super admin)" }, 403);

    /* --------------------------------------------------
       3) Body
    -------------------------------------------------- */
    const body = await req.json().catch(() => ({}));
    const { nome, email, foto, estado_utilizador, is_super } = body;

    if (!nome || !email)
      return json({ error: "Campos obrigatórios: nome, email" }, 400);

    /* --------------------------------------------------
       4) Criar utilizador no Auth
    -------------------------------------------------- */
    const supaAdmin = supaAdminClient();

    const username = usernameFromEmail(email);
    const tempPassword = `${username}1234`;

    const { data: created, error: createErr } = await supaAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: tempPassword,
      user_metadata: {
        nome,
        role: "admin",
        must_reset_password: true,
      },
      app_metadata: { role: "admin" },
    });

    if (createErr || !created?.user)
      return json({ error: createErr?.message || "Falha ao criar utilizador" }, 400);

    const newUser = created.user;

    /* --------------------------------------------------
       5) Inserir na tabela admin
    -------------------------------------------------- */
    const { error: insertErr } = await supaAdmin.from("admin").insert({
      id: newUser.id,
      nome,
      email,
      foto: foto ?? null,
      estado_utilizador: estado_utilizador || "ativo",
      is_super: !!is_super,
    });

    if (insertErr) {
      await supaAdmin.auth.admin.deleteUser(newUser.id);
      return json({ error: "Falha ao salvar admin: " + insertErr.message }, 400);
    }

    /* --------------------------------------------------
       6) Email
    -------------------------------------------------- */
    const subject = "Acesso de Administrador — Sistema do Condomínio";
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
        <h2>Olá, ${nome}!</h2>
        <p>Foi criado um acesso de <strong>administrador</strong>.</p>
        <p><strong>Credenciais temporárias:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Senha:</strong> ${tempPassword}</li>
        </ul>
        <p>Você deve alterar esta senha no primeiro login.</p>
      </div>
    `.trim();

    try {
      await sendResendEmail(email, subject, html);
    } catch (e) {
      console.error("Erro email:", e);
      return json({
        ok: true,
        user_id: newUser.id,
        email_sent: false,
        message: "Admin criado, mas o email falhou.",
      });
    }

    return json({ ok: true, user_id: newUser.id, email_sent: true });

  } catch (e) {
    console.error("ERRO CREATE-ADMIN:", e);
    return json({ error: e?.message || String(e) }, 500);
  }
});
