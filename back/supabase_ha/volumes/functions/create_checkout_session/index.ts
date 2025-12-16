// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^16.6.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-06-20",
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers":
          "content-type,authorization,x-client-info,apikey",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });

  try {
    const raw = await req.text();
    let body = null;

    try { body = JSON.parse(raw); } catch {}

    if (!body || typeof body !== "object")
      return json({ error: "Body JSON inválido" }, 400);

    const { fatura_id } = body;

    if (!fatura_id)
      return json({ error: "fatura_id é obrigatório" }, 400);

    // --- ENV ----------------------------------------------------
    const SUPABASE_URL = Deno.env.get("PROJECT_URL");
    const ANON_KEY = Deno.env.get("ANON_KEY");

    if (!SUPABASE_URL || !ANON_KEY) {
      console.error("Faltam envs PROJECT_URL / ANON_KEY");
      return json({ error: "Configuração do servidor incompleta" }, 500);
    }

    // --- PASSAR JWT DO USER ------------------------------------
    const authHeader = req.headers.get("Authorization") ?? "";

    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // --- BUSCAR FATURA ------------------------------------------
    const { data: f, error: ferr } = await supabase
        .from("fatura")
        .select("id, titulo, descricao, valor, estado_fatura")
        .eq("id", fatura_id)
        .single();

    if (ferr || !f)
      return json({ error: "Fatura não encontrada" }, 404);

    if (String(f.estado_fatura).toLowerCase() !== "pendente")
      return json({ error: "Fatura não está pendente" }, 400);

    // --- STRIPE -------------------------------------------------
    const valorNum = Number(f.valor);
    if (!isFinite(valorNum) || valorNum <= 0)
      return json({ error: "Valor inválido" }, 400);

    const amount = Math.round(valorNum * 100);

    const origin =
        req.headers.get("origin") ??
        Deno.env.get("PUBLIC_SITE_URL") ??
        "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "pt",
      invoice_creation: { enabled: true },
      payment_intent_data: { metadata: { fatura_id: f.id } },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amount,
            product_data: {
              name: f.titulo,
              description: f.descricao ?? undefined,
            },
          },
        },
      ],
      metadata: { fatura_id: f.id },
      success_url: `${origin}/success?fatura=${f.id}`,
      cancel_url: `${origin}/cancel?fatura=${f.id}`,
    });

    return json({ url: session.url });
  } catch (e) {
    console.error("create_checkout_session error:", e);
    return json({ error: e?.message ?? String(e) }, 400);
  }
});
