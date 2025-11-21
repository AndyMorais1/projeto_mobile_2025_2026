// supabase/functions/create_payment/index.ts
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^16.6.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// ---------- CORS ----------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
function withCors(res) {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders))h.set(k, v);
  return new Response(res.body, {
    status: res.status,
    headers: h
  });
}
function json(body, status = 200) {
  return withCors(new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  }));
}
// ---------- ENV ----------
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("PROJECT_URL");
const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE_KEY");
if (!STRIPE_SECRET_KEY) console.error("STRIPE_SECRET_KEY ausente nos Secrets.");
if (!SUPABASE_URL) console.error("SUPABASE_URL ausente nos Secrets.");
if (!SERVICE_ROLE) console.error("SUPABASE_SERVICE_ROLE_KEY ausente nos Secrets.");
const stripe = new Stripe(STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20"
});
Deno.serve(async (req)=>{
  // Preflight CORS
  if (req.method === "OPTIONS") return withCors(new Response("ok"));
  if (req.method !== "POST") {
    return json({
      error: "Método não suportado. Use POST."
    }, 405);
  }
  try {
    // Body
    let body = null;
    try {
      body = await req.json();
    } catch  {
      return json({
        error: "Body JSON inválido."
      }, 400);
    }
    const fatura_id = body?.fatura_id;
    const metodo = body?.metodo;
    // mbway_phone é intencionalmente ignorado aqui (o cliente fornece no confirm)
    if (!fatura_id) return json({
      error: "fatura_id é obrigatório."
    }, 400);
    if (!metodo) return json({
      error: "metodo é obrigatório (multibanco | mbway)."
    }, 400);
    // Supabase (service role). Opcional: encadear Authorization p/ saber quem chama.
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") ?? ""
        }
      }
    });
    // 1) Fatura
    const { data: f, error: ferr } = await supabase.from("fatura").select("id, valor, moeda, titulo, descricao, estado_fatura").eq("id", fatura_id).single();
    if (ferr || !f) return json({
      error: "Fatura não encontrada."
    }, 404);
    if ((f.estado_fatura || "").toLowerCase() === "pago") {
      return json({
        error: "Fatura já está paga."
      }, 400);
    }
    if ((f.moeda || "").toUpperCase() !== "EUR") {
      return json({
        error: "Apenas EUR é suportado neste método."
      }, 400);
    }
    const amount = Math.round(Number(f.valor) * 100);
    if (!Number.isFinite(amount) || amount < 50) {
      // Stripe exige >= 50 cêntimos
      return json({
        error: "Valor mínimo é €0,50."
      }, 400);
    }
    const currency = "eur";
    // 2) Registro pagamento
    const { data: pay, error: perr } = await supabase.from("pagamento").insert({
      fatura_id: f.id,
      valor: f.valor,
      moeda: "EUR",
      metodo,
      provedor: "stripe",
      estado: "requires_payment_method"
    }).select().single();
    if (perr || !pay) return json({
      error: "Falha ao criar registro de pagamento."
    }, 500);
    // 3) Stripe PI
    if (metodo === "multibanco") {
      // cria e confirma; devolve entidade/referência
      const pi = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method_types: [
          "multibanco"
        ],
        description: `Fatura ${f.titulo}`,
        metadata: {
          fatura_id: f.id,
          pagamento_id: pay.id
        }
      });
      const confirmed = await stripe.paymentIntents.confirm(pi.id, {
        payment_method_data: {
          type: "multibanco"
        }
      });
      const next = confirmed.next_action || {};
      const mb = next.multibanco_display_details || next.display_bank_transfer_instructions || {};
      const entidade = mb?.entity ?? mb?.reference_entity ?? null;
      const referencia = mb?.reference ?? mb?.reference_number ?? null;
      const expiresAt = mb?.expires_at ? new Date(mb.expires_at * 1000).toISOString() : null;
      await supabase.from("pagamento").update({
        payment_intent: confirmed.id,
        client_secret: confirmed.client_secret,
        estado: confirmed.status,
        mb_entidade: entidade,
        mb_referencia: referencia,
        mb_expires_at: expiresAt,
        raw_payload: confirmed
      }).eq("id", pay.id);
      return json({
        pagamento_id: pay.id,
        tipo: "multibanco",
        entidade,
        referencia,
        valor: f.valor,
        expires_at: expiresAt
      });
    }
    if (metodo === "mbway") {
      // devolve client_secret; confirmação deve acontecer no cliente (Stripe.js / SDK)
      const pi = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method_types: [
          "mb_way"
        ],
        description: `Fatura ${f.titulo}`,
        metadata: {
          fatura_id: f.id,
          pagamento_id: pay.id
        }
      });
      await supabase.from("pagamento").update({
        payment_intent: pi.id,
        client_secret: pi.client_secret,
        estado: pi.status,
        raw_payload: pi
      }).eq("id", pay.id);
      return json({
        pagamento_id: pay.id,
        tipo: "mbway",
        status: pi.status,
        client_secret: pi.client_secret
      });
    }
    return json({
      error: "Método de pagamento não suportado."
    }, 400);
  } catch (e) {
    return json({
      error: String(e)
    }, 400);
  }
});
