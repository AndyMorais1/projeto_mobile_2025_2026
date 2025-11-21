// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^16.6.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-06-20",
});

// -------------------------------------
// Helper: resposta JSON
// -------------------------------------
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

// -------------------------------------
// MAIN
// -------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });

  try {
    // --------------------------------------------------------
    // 1) Ler o RAW BODY (porque req.json() às vezes falha)
    // --------------------------------------------------------
    const raw = await req.text();
    console.log("BODY RAW:", raw);

    let body = null;

    try {
      body = JSON.parse(raw);
    } catch {
      console.log("Falha ao fazer JSON.parse no raw body");
      body = null;
    }

    console.log("BODY PARSED:", body);

    // Se body for null, paramos aqui
    if (!body || typeof body !== "object") {
      return json({ error: "Body JSON inválido" }, 400);
    }

    const { fatura_id } = body;
    console.log("FATURA_ID RECEBIDO:", fatura_id);

    if (!fatura_id) {
      return json({ error: "fatura_id é obrigatório" }, 400);
    }

    // --------------------------------------------------------
    // 2) ENV CHECK
    // --------------------------------------------------------
    const SUPABASE_URL = Deno.env.get("PROJECT_URL");
    const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("Faltam envs PROJECT_URL/SERVICE_ROLE");
      return json({ error: "Configuração do servidor incompleta" }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // --------------------------------------------------------
    // 3) Buscar fatura
    // --------------------------------------------------------
    const { data: f, error: ferr } = await supabase
        .from("fatura")
        .select("id, titulo, descricao, valor, estado_fatura")
        .eq("id", fatura_id)
        .single();

    console.log("RESULTADO SELECT:", { f, ferr });

    if (ferr || !f) {
      return json({ error: "Fatura não encontrada" }, 404);
    }

    if (String(f.estado_fatura).toLowerCase() !== "pendente") {
      return json(
          { error: `Fatura não está pendente (estado: ${f.estado_fatura})` },
          400
      );
    }

    // --------------------------------------------------------
    // 4) Criar sessão Stripe
    // --------------------------------------------------------
    const valorNum = Number(f.valor);
    if (!isFinite(valorNum) || valorNum <= 0) {
      return json({ error: "Valor da fatura inválido" }, 400);
    }

    const amount = Math.round(valorNum * 100);

    const origin =
        req.headers.get("origin") ??
        Deno.env.get("PUBLIC_SITE_URL") ??
        "http://localhost:3000";

    const pmTypesEnv = Deno.env.get("STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES");
    const payment_method_types = pmTypesEnv
        ? pmTypesEnv.split(",").map((x) => x.trim()).filter(Boolean)
        : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "pt",
      invoice_creation: { enabled: true },
      payment_intent_data: {
        metadata: { fatura_id: f.id },
      },
      ...(payment_method_types ? { payment_method_types } : {}),
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

    console.log("STRIPE SESSION:", session.url);

    return json({ url: session.url });
  } catch (e) {
    console.error("create_checkout_session error:", e);
    return json({ error: String(e?.message ?? e) }, 400);
  }
});
