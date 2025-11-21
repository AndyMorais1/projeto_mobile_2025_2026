// deno-lint-ignore-file no-explicit-any
// @ts-nocheck
/**
 * Edge Function: admin_create_morador
 *
 * O que faz:
 * - Verifica que o chamador é um ADMIN "ativo" (não exige is_super).
 * - Cria um utilizador no Supabase Auth com senha temporária (<username>+1234).
 * - Insere o registo correspondente em public.morador (com must_reset_password = true).
 * - Envia e-mail com as credenciais temporárias via Resend.
 *
 * Como chamar:
 * POST https://<PROJECT_REF>.functions.supabase.co/admin_create_morador
 * Headers:
 * Authorization: Bearer <JWT do admin>
 * Content-Type: application/json
 * Body:
 * { "nome": "Maria", "email": "maria@example.com", "telefone": "...", "bi": "...", "foto": null }
 */ import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
/* ======================
 * 1) Variáveis de ambiente (SECRETS)
 * - NÃO use prefixo SUPABASE_ nos nomes no dashboard.
 * ====================== */ const PROJECT_URL = Deno.env.get("PROJECT_URL"); // ex.: https://xxxxxx.supabase.co
const ANON_KEY = Deno.env.get("ANON_KEY"); // public anon key (valida JWT do chamador)
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY"); // service role key (bypassa RLS para criar user/DB)
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY"); // re_...
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "no-reply@onresend.com";

/* ======================
 * 2) Utilidades
 * ====================== */ const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};
// helper para responder JSON consistente
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
}
// cria um supabase client “de usuário” (usa o JWT do chamador via Authorization)
function supaUserClient(authHeader) {
  return createClient(PROJECT_URL, ANON_KEY, {
    global: {
      headers: {
        Authorization: authHeader ?? ""
      }
    }
  });
}
// supabase client “admin” (service role) — cria auth user, escreve ignorando RLS
function supaAdminClient() {
  return createClient(PROJECT_URL, SERVICE_ROLE_KEY);
}
// cria username a partir do e-mail (para compor a senha temporária)
function usernameFromEmail(email) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
}
// envio de e-mail via API do Resend (sem SDK)
async function sendResendEmail(to, subject, html) {
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
    // devolve o corpo como texto para facilitar o debug no dashboard
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}
/* ======================
 * 3) HTTP handler
 * ====================== */ serve(async (req)=>{
  try {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders
      });
    }
    if (req.method !== "POST") {
      return json({
        error: "Use POST"
      }, 405);
    }
    // Extrai o JWT do admin que está a chamar
    const authHeader = req.headers.get("Authorization") || "";
    const supaUser = supaUserClient(authHeader);
    // 3.1) valida sessão do chamador (precisa estar autenticado)
    const { data: userRes, error: userErr } = await supaUser.auth.getUser();
    if (userErr || !userRes?.user) {
      return json({
        error: "Não autenticado"
      }, 401);
    }
    // 3.2) garante que é um ADMIN ATIVO (não restringe a super admin)
    // - pega só as colunas necessárias para não expor dados sensíveis
    const { data: adminRow, error: adminErr } = await supaUser.from("admin").select("id, estado_utilizador").eq("id", userRes.user.id).maybeSingle();
    if (adminErr || !adminRow) {
      return json({
        error: "Acesso negado (não é admin)"
      }, 403);
    }
    if (adminRow.estado_utilizador !== "ativo") {
      return json({
        error: "Acesso negado (admin inativo)"
      }, 403);
    }
    // 3.3) lê o payload enviado pelo admin
    const body = await req.json().catch(()=>({}));
    const { nome, email, telefone, bi, foto, admin_id } = body ?? {};
    // validação mínima do payload
    if (!nome || !email) {
      return json({
        error: "Campos obrigatórios: nome, email"
      }, 400);
    }
    // 3.4) compõe a senha temporária: <username>+1234
    const username = usernameFromEmail(email);
    const tempPassword = `${username}1234`;
    // 3.5) cria o utilizador no Auth com service role
    const supaAdmin = supaAdminClient();
    const { data: created, error: createErr } = await supaAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: tempPassword,
      user_metadata: {
        nome,
        role: "morador",
        must_reset_password: true
      },
      app_metadata: {
        role: "morador"
      }
    });
    if (createErr || !created?.user) {
      return json({
        error: createErr?.message || "Falha ao criar utilizador"
      }, 400);
    }
    const newUser = created.user;
    // 3.6) insere o registo em public.morador (PK = auth.users.id)
    const { error: insertErr } = await supaAdmin.from("morador").insert({
      id: newUser.id,
      nome,
      email,
      telefone: telefone ?? null,
      bi: bi ?? null,
      foto: foto ?? null,
      // quem criou: usa o admin chamador por default, a não ser que venha explicitado
      admin_id: admin_id ?? adminRow.id,
      must_reset_password: true
    });
    if (insertErr) {
      // rollback: se falhar a inserção na DB, remove o user do Auth
      await supaAdmin.auth.admin.deleteUser(newUser.id);
      return json({
        error: "Falha ao salvar morador: " + insertErr.message
      }, 400);
    }
    // 3.7) envia o e-mail com as credenciais temporárias (via Resend)
    const subject = "Acesso ao Sistema do Condomínio";
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
        <h2>Olá, ${nome}!</h2>
        <p>Foi criado um acesso para você no sistema do condomínio.</p>
        <p><strong>Credenciais temporárias:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Senha:</strong> ${tempPassword}</li>
        </ul>
        <p><strong>Importante:</strong> esta senha é temporária. Você <em>precisa</em> trocá-la no primeiro login; enquanto não fizer a troca, o acesso ao sistema ficará bloqueado.</p>
      </div>
    `.trim();
    try {
      await sendResendEmail(email, subject, html);
    } catch (mailErr) {
      // Caso o e-mail falhe, o utilizador já foi criado — retorna aviso para o frontend tratar.
      console.error(mailErr);
      return json({
        ok: true,
        user_id: newUser.id,
        email_sent: false,
        message: "Utilizador criado, mas o envio de e-mail falhou. Verifique RESEND_API_KEY/EMAIL_FROM/domínio."
      });
    }
    // 3.8) sucesso geral
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
