// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

/**
 * Edge Function: admin_create_morador (SUPABASE HA READY)
 *
 * Compatível com Supabase HA (Kong) e valida JWT via GoTrue interno.
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// =====================================================
// ENV
// =====================================================
const PROJECT_URL = Deno.env.get("PROJECT_URL"); // http://kong:8000
const INTERNAL_AUTH_URL = Deno.env.get("INTERNAL_AUTH_URL"); // http://auth:9999
const ANON_KEY = Deno.env.get("ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "no-reply@onresend.com";

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

// =============================================================
// 🔥 FIX SUPABASE HA — Validação JWT no GoTrue interno
// =============================================================
async function getUserFromJWT(authHeader: string) {
  try {
    if (!authHeader) return null;

    const url = `${INTERNAL_AUTH_URL}/user`;

    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.log("Auth response:", res.status, body);
      return null;
    }

    return await res.json();
  } catch (e) {
    console.error("[AUTH ERROR]", e);
    return null;
  }
}

// =============================================================
// CLIENTES SUPABASE
// =============================================================
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

// =============================================================
// MAIN FUNCTION
// =============================================================
serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Use POST" }, 405);

    // JWT do cliente
    const authHeader = req.headers.get("Authorization") || "";
    console.log("AUTH HEADER RECEBIDO:", authHeader);

    // ---------------------------------------------------------
    // 1) VALIDAR JWT NO GOTRUE INTERNO
    // ---------------------------------------------------------
    const userData = await getUserFromJWT(authHeader);

    if (!userData?.id) {
      console.log("JWT inválido:", authHeader);
      return json({ error: "Não autenticado" }, 401);
    }

    const userId = userData.id;

    const supaUser = supaUserClient(authHeader);

    // ---------------------------------------------------------
    // 2) VALIDAR SE É ADMIN
    // ---------------------------------------------------------
    const { data: adminRow, error: adminErr } = await supaUser
        .from("admin")
        .select("id, estado_utilizador")
        .eq("id", userId)
        .single();

    if (adminErr || !adminRow)
      return json({ error: "Acesso negado (não é admin)" }, 403);

    if (adminRow.estado_utilizador !== "ativo")
      return json({ error: "Acesso negado (admin inativo)" }, 403);

    // ---------------------------------------------------------
    // 3) BODY DA REQUEST
    // ---------------------------------------------------------
    const body = await req.json().catch(() => ({}));
    const { nome, email, telefone, bi, foto, admin_id } = body ?? {};

    if (!nome || !email)
      return json({ error: "Campos obrigatórios: nome, email" }, 400);

    const supaAdmin = supaAdminClient();

    // ---------------------------------------------------------
    // 4) CRIAR USER NO AUTH
    // ---------------------------------------------------------
    const username = usernameFromEmail(email);
    const tempPassword = `${username}1234`;

    const { data: created, error: createErr } =
        await supaAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          password: tempPassword,
          user_metadata: {
            nome,
            role: "morador",
            must_reset_password: true,
          },
          app_metadata: { role: "morador" },
        });

    if (createErr || !created?.user)
      return json(
          { error: createErr?.message || "Falha ao criar utilizador" },
          400,
      );

    const newUser = created.user;

    // ---------------------------------------------------------
    // 5) INSERIR NA TABELA MORADOR
    // ---------------------------------------------------------
    const { error: insertErr } = await supaAdmin
        .from("morador")
        .insert({
          id: newUser.id,
          nome,
          email,
          telefone: telefone ?? null,
          bi: bi ?? null,
          foto: foto ?? null,
          admin_id: admin_id ?? adminRow.id,
          must_reset_password: true,
        });

    if (insertErr) {
      await supaAdmin.auth.admin.deleteUser(newUser.id);
      return json(
          { error: "Falha ao salvar morador: " + insertErr.message },
          400,
      );
    }

    // ---------------------------------------------------------
    // 6) ENVIAR EMAIL
    // ---------------------------------------------------------
    try {
      const subject = "Acesso ao Sistema do Condomínio";
      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
          <h2>Olá, ${nome}!</h2>
          <p>Sua conta foi criada no sistema do condomínio.</p>

          <p><strong>Credenciais temporárias:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Senha:</strong> ${tempPassword}</li>
          </ul>

          <p>⚠️ Esta senha é temporária. Deve ser alterada no primeiro login.</p>
        </div>
      `.trim();

      await sendResendEmail(email, subject, html);
    } catch (e) {
      console.error("Erro no envio do email:", e);
      return json({
        ok: true,
        user_id: newUser.id,
        email_sent: false,
        message: "Morador criado, mas email falhou.",
      });
    }

    return json({ ok: true, user_id: newUser.id, email_sent: true });

  } catch (e) {
    console.error("ERRO ADMIN_CREATE_MORADOR:", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});
