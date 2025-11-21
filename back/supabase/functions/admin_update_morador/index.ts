// supabase/functions/admin_update_morador/index.ts
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
/** ======================= CORS HELPERS ======================= **/ const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://*.vercel.app"
];
function originAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some((p)=>p.includes("*") ? new RegExp("^" + p.replace(/\./g, "\\.").replace("*\\.", "([a-z0-9-]+\\.)?") + "$", "i").test(origin) : p === origin);
}
function corsHeaders(origin) {
  // se quiser bloquear origens não permitidas, troque "*" por origin quando allowed = true, caso contrário retorne 403
  const allowed = originAllowed(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "*",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-requested-with",
    "Access-Control-Max-Age": "86400"
  };
}
function json(body, init = {
  origin: null
}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(init.origin),
      ...init.headers || {}
    }
  });
}
function noContent(origin) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}
/** ============================================================ **/ Deno.serve(async (req)=>{
  const origin = req.headers.get("origin");
  // 1) Preflight
  if (req.method === "OPTIONS") {
    return noContent(origin);
  }
  try {
    if (req.method !== "POST") {
      return json({
        ok: false,
        error: "Method not allowed"
      }, {
        origin,
        status: 405
      });
    }
    const body = await req.json().catch(()=>({}));
    const { user_id, nome, email, telefone, bi, foto, estado_utilizador } = body || {};
    if (!user_id || !nome || !email) {
      return json({
        ok: false,
        error: "Campos obrigatórios: user_id, nome, email"
      }, {
        origin,
        status: 400
      });
    }
    const url = Deno.env.get("PROJECT_URL");
    const service = Deno.env.get("SERVICE_ROLE_KEY");
    const admin = createClient(url, service, {
      auth: {
        persistSession: false
      }
    });
    // 2) Atualiza o utilizador no Auth (email + user_metadata)
    {
      const { error } = await admin.auth.admin.updateUserById(user_id, {
        email,
        user_metadata: {
          name: nome,
          phone: telefone ?? null,
          bi: bi ?? null,
          picture: foto ?? null,
          estado_utilizador: estado_utilizador ?? "pendente"
        }
      });
      if (error) throw error;
    }
    // 3) Atualiza o perfil na tabela "morador"
    {
      const { error } = await admin.from("morador").update({
        nome,
        email,
        telefone: telefone ?? null,
        bi: bi ?? null,
        foto: foto ?? null,
        estado_utilizador: estado_utilizador ?? "pendente",
        updated_at: new Date().toISOString()
      }).eq("id", user_id);
      if (error) throw error;
    }
    return json({
      ok: true
    }, {
      origin,
      status: 200
    });
  } catch (e) {
    return json({
      ok: false,
      error: String(e?.message || e)
    }, {
      origin,
      status: 500
    });
  }
});
