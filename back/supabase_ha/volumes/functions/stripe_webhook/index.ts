// supabase/functions/stripe_webhook/index.ts
// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@16.6.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib";

/* ============================================================
   STRIPE INIT
============================================================ */
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
  console.error("[WEBHOOK] Stripe keys missing from env");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

/* ============================================================
   HELPERS
============================================================ */
function ok(msg = "ok") {
  return new Response(msg, { status: 200 });
}

function bad(msg) {
  return new Response(msg, {
    status: 400,
    headers: { "Content-Type": "text/plain" },
  });
}

/* ============================================================
   Storage Upload — SUPABASE HA SAFE
============================================================ */
async function uploadReceiptPDF(supabase, fatura, chargeId) {
  try {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    const draw = (txt, x, y, size = 12) =>
        page.drawText(txt, { x, y, size, font, color: rgb(0, 0, 0) });

    let y = 800;

    draw("Recibo de Pagamento", 50, y, 18);
    y -= 30;

    draw(`Fatura: ${fatura.titulo}`, 50, y);
    y -= 18;

    draw(`ID: ${fatura.id}`, 50, y);
    y -= 18;

    draw(`Valor: ${Number(fatura.valor).toFixed(2)} ${fatura.moeda}`, 50, y);
    y -= 18;

    if (chargeId) {
      draw(`Stripe Charge: ${chargeId}`, 50, y);
      y -= 18;
    }

    draw(`Data: ${new Date().toLocaleString("pt-PT")}`, 50, y);

    const bytes = await pdf.save(); // Uint8Array

    const filename = `recibo_${fatura.id}.pdf`;

    const { error } = await supabase.storage
        .from("recibos")
        .upload(filename, bytes, {
          upsert: true,
          contentType: "application/pdf",
        });

    if (error) {
      console.error("[UPLOAD ERROR]", error);
      return null;
    }

    const { data: pub } = supabase.storage
        .from("recibos")
        .getPublicUrl(filename);

    return pub?.publicUrl ?? null;
  } catch (err) {
    console.error("[PDF ERROR]", err);
    return null;
  }
}

/* ============================================================
   Get invoice PDF (retry)
============================================================ */
async function tryGetInvoicePdf(invoiceId, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    const inv = await stripe.invoices.retrieve(invoiceId);
    if (inv?.invoice_pdf) return inv.invoice_pdf;
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

/* ============================================================
   DB helpers
============================================================ */
async function markPaid(supabase, faturaId, reciboUrl) {
  await supabase.from("fatura").update({
    estado_fatura: "pago",
    recibo_url: reciboUrl,
    updated_at: new Date().toISOString(),
  }).eq("id", faturaId);
}

/* ============================================================
   HANDLE PAYMENT INTENT
============================================================ */
async function handlePaymentIntent(supabase, piId, session = null) {
  const pi = await stripe.paymentIntents.retrieve(piId, {
    expand: ["latest_charge", "charges"],
  });

  const faturaId =
      pi.metadata?.fatura_id ||
      session?.metadata?.fatura_id ||
      null;

  if (!faturaId) return;

  const invoiceId =
      session?.invoice ||
      (typeof pi.latest_charge?.invoice === "string"
          ? pi.latest_charge.invoice
          : null);

  if (invoiceId) {
    const pdf = await tryGetInvoicePdf(invoiceId);
    if (pdf) {
      await markPaid(supabase, faturaId, pdf);
      return;
    }
  }

  const charge =
      pi.latest_charge ||
      pi.charges?.data?.[0] ||
      null;

  if (charge?.receipt_url) {
    await markPaid(supabase, faturaId, charge.receipt_url);
    return;
  }

  const { data: fat } = await supabase
      .from("fatura")
      .select("id, titulo, valor, moeda")
      .eq("id", faturaId)
      .single();

  if (fat) {
    const fallback = await uploadReceiptPDF(supabase, fat, charge?.id ?? null);
    await markPaid(supabase, faturaId, fallback);
  }
}

/* ============================================================
   HANDLE INVOICE
============================================================ */
async function handleInvoice(supabase, invoice) {
  const faturaId = invoice.metadata?.fatura_id ?? null;

  if (faturaId && invoice.invoice_pdf) {
    await markPaid(supabase, faturaId, invoice.invoice_pdf);
    return;
  }
}

/* ============================================================
   ENTRYPOINT (Supabase HA)
============================================================ */
Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");

  if (!sig || !STRIPE_WEBHOOK_SECRET) {
    return bad("Missing stripe signature or secret");
  }

  const rawBody = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
        rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return bad("Webhook signature failed: " + err);
  }

  const PROJECT_URL = Deno.env.get("PROJECT_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

  const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object;
        const piId =
            typeof cs.payment_intent === "string"
                ? cs.payment_intent
                : cs.payment_intent?.id;
        if (piId) await handlePaymentIntent(supabase, piId, cs);
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object;
        await handlePaymentIntent(supabase, pi.id);
        break;
      }

      case "invoice.finalized": {
        await handleInvoice(supabase, event.data.object);
        break;
      }

      case "invoice.paid": {
        await handleInvoice(supabase, event.data.object);
        break;
      }

      default:
        break;
    }

    return ok();
  } catch (err) {
    console.error("[WEBHOOK ERROR]", err);
    return bad("Error: " + err);
  }
});
