// functions/create-admin/index.ts
// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
/* ======================
 * 1) Variáveis de ambiente (SECRETS)
 * ====================== */ const PROJECT_URL = Deno.env.get("PROJECT_URL");// ex: https://xxxxxx.supabase.co
const ANON_KEY = Deno.env.get("ANON_KEY"); // public anon key
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY"); // service role key
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "no-reply@onresend.com";
/* ======================
 * 2) Utils
 * ====================== */ const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
}
function supaUserClient(authHeader) {
  if (!PROJECT_URL || !ANON_KEY) throw new Error("PROJECT_URL/ANON_KEY não configurados");
  return createClient(PROJECT_URL, ANON_KEY, {
    global: {
      headers: {
        Authorization: authHeader ?? ""
      }
    }
  });
}
function supaAdminClient() {
  if (!PROJECT_URL || !SERVICE_ROLE_KEY) throw new Error("PROJECT_URL/SERVICE_ROLE_KEY não configurados");
  return createClient(PROJECT_URL, SERVICE_ROLE_KEY);
}
function usernameFromEmail(email) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
}
async function sendResendEmail(to, subject, html) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurada");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [
        to
      ],
      subject,
      html
    })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}
/* ======================
 * 3) Handler
 * ====================== */ serve(async (req)=>{
  try {
    if (req.method === "OPTIONS") return new Response("ok", {
      headers: corsHeaders
    });
    if (req.method !== "POST") return json({
      error: "Use POST"
    }, 405);
    // 3.1) valida sessão do chamador
    const authHeader = req.headers.get("Authorization") || "";
    const supaUser = supaUserClient(authHeader);
    const { data: userRes, error: userErr } = await supaUser.auth.getUser();
    if (userErr || !userRes?.user) return json({
      error: "Não autenticado"
    }, 401);
    // 3.2) garante ADMIN ATIVO E SUPER
    const { data: adminRow, error: adminErr } = await supaUser.from("admin").select("id, estado_utilizador, is_super").eq("id", userRes.user.id).maybeSingle();
    if (adminErr || !adminRow) return json({
      error: "Acesso negado (não é admin)"
    }, 403);
    if (adminRow.estado_utilizador !== "ativo") return json({
      error: "Acesso negado (admin inativo)"
    }, 403);
    if (!adminRow.is_super) return json({
      error: "Acesso negado (apenas super admin)"
    }, 403);
    // 3.3) payload
    const body = await req.json().catch(()=>({}));
    const { nome, email, foto, estado_utilizador, is_super } = body ?? {};
    if (!nome || !email) return json({
      error: "Campos obrigatórios: nome, email"
    }, 400);
    // 3.4) compõe senha temporária
    const username = usernameFromEmail(String(email));
    const tempPassword = `${username}1234`;
    // 3.5) cria utilizador no Auth
    const supaAdmin = supaAdminClient();
    const { data: created, error: createErr } = await supaAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: tempPassword,
      user_metadata: {
        nome,
        role: "admin",
        must_reset_password: true
      },
      app_metadata: {
        role: "admin"
      }
    });
    if (createErr || !created?.user) {
      return json({
        error: createErr?.message || "Falha ao criar utilizador"
      }, 400);
    }
    const newUser = created.user;
    // 3.6) insere na tabela public.admin (PK = auth.users.id)
    const { error: insertErr } = await supaAdmin.from("admin").insert({
      id: newUser.id,
      nome,
      email,
      foto: foto ?? null,
      estado_utilizador: estado_utilizador || "ativo",
      is_super: !!is_super
    });
    if (insertErr) {
      // rollback
      await supaAdmin.auth.admin.deleteUser(newUser.id);
      return json({
        error: "Falha ao salvar admin: " + insertErr.message
      }, 400);
    }
    // 3.7) e-mail de credenciais
    const subject = "Acesso de Administrador — Sistema do Condomínio";
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
        <h2>Olá, ${nome}!</h2>
        <p>Foi criado um acesso de <strong>administrador</strong> para você.</p>
        <p><strong>Credenciais temporárias:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Senha:</strong> ${tempPassword}</li>
        </ul>
        <p><strong>Importante:</strong> esta senha é temporária. Você <em>precisa</em> trocá-la no primeiro login.</p>
      </div>
    `.trim();
    try {
      await sendResendEmail(email, subject, html);
    } catch (mailErr) {
      console.error(mailErr);
      return json({
        ok: true,
        user_id: newUser.id,
        email_sent: false,
        message: "Admin criado, mas o envio de e-mail falhou. Verifique RESEND_API_KEY/EMAIL_FROM/domínio."
      });
    }
    // 3.8) sucesso
    return json({
      ok: true,
      user_id: newUser.id,
      email_sent: true
    });
  } catch (e) {
    console.error(e);
    return json({
      error: e?.message || String(e)
    }, 500);
  }
});
