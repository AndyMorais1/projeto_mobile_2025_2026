// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^16.6.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-06-20"
});
function ok(txt = "ok") {
  return new Response(txt, {
    status: 200
  });
}
function bad(msg) {
  return new Response(msg, {
    status: 400,
    headers: {
      "Content-Type": "text/plain"
    }
  });
}
/* ----------------- UTIL ----------------- */ async function generateAndUploadReceiptPdf(supabase, f, chargeId) {
  try {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([
      595,
      842
    ]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const draw = (t, x, y, size = 12)=>page.drawText(t, {
      x,
      y,
      size,
      font,
      color: rgb(0, 0, 0)
    });
    let y = 800;
    draw("Recibo de Pagamento", 50, y, 18);
    y -= 30;
    draw(`Fatura: ${f.titulo}`, 50, y);
    y -= 18;
    draw(`Fatura ID: ${f.id}`, 50, y);
    y -= 18;
    draw(`Valor: ${Number(f.valor).toFixed(2)} ${f.moeda}`, 50, y);
    y -= 18;
    if (chargeId) {
      draw(`Stripe Charge: ${chargeId}`, 50, y);
      y -= 18;
    }
    draw(`Data: ${new Date().toLocaleString("pt-PT")}`, 50, y);
    const bytes = await pdf.save();
    const path = `fatura_${f.id}.pdf`;
    const { error } = await supabase.storage.from("recibos").upload(path, new Blob([
      bytes
    ], {
      type: "application/pdf"
    }), {
      cacheControl: "3600",
      upsert: true,
      contentType: "application/pdf"
    });
    if (error) return null;
    // Se o bucket for público, devolvemos a URL pública.
    const { data: pub } = supabase.storage.from("recibos").getPublicUrl(path);
    return pub?.publicUrl ?? null;
  } catch  {
    return null;
  }
}
// Tenta obter invoice_pdf com alguns retries (em ms)
async function getInvoicePdfWithRetry(stripe, invoiceId, timeoutMs = 4000, intervalMs = 400) {
  const start = Date.now();
  while(Date.now() - start < timeoutMs){
    const inv = await stripe.invoices.retrieve(invoiceId);
    if (inv.invoice_pdf) return inv.invoice_pdf;
    await new Promise((r)=>setTimeout(r, intervalMs));
  }
  return null;
}
async function setFaturaPagoComRecibo(supabase, faturaId, reciboUrl) {
  await supabase.from("fatura").update({
    estado_fatura: "pago",
    recibo_url: reciboUrl,
    updated_at: new Date().toISOString()
  }).eq("id", faturaId);
}
/* --------------- HANDLERS --------------- */ async function handleByPaymentIntentId(supabase, piId, cs) {
  const pi = await stripe.paymentIntents.retrieve(piId, {
    expand: [
      "latest_charge",
      "charges"
    ]
  });
  const faturaId = pi.metadata?.fatura_id || cs?.metadata?.fatura_id || null;
  if (!faturaId) return;
  // 1) tentar obter invoice a partir da session ou da charge
  let invoiceId = null;
  if (cs?.invoice) {
    invoiceId = typeof cs.invoice === "string" ? cs.invoice : cs.invoice.id;
  }
  if (!invoiceId && typeof pi.latest_charge?.invoice === "string") {
    invoiceId = pi.latest_charge.invoice;
  }
  // 1.a) se temos invoice, tentar pegar o PDF com retries curtos
  if (invoiceId) {
    const pdf = await getInvoicePdfWithRetry(stripe, invoiceId);
    if (pdf) {
      await setFaturaPagoComRecibo(supabase, faturaId, pdf);
      return;
    }
    // Se não veio ainda, NÃO cai para fallback aqui — deixa outros eventos (invoice.paid/finalized) resolverem.
    await setFaturaPagoComRecibo(supabase, faturaId, null);
    return;
  }
  // 2) sem invoice: usar hosted receipt da charge (HTML) como segunda opção
  let reciboUrl = null;
  let chargeId = null;
  const latest = pi.latest_charge;
  if (latest?.receipt_url) {
    reciboUrl = latest.receipt_url;
    chargeId = latest.id ?? null;
  } else if (pi.charges?.data?.length) {
    const c = pi.charges.data[0];
    reciboUrl = c.receipt_url ?? null;
    chargeId = c.id ?? null;
  }
  if (reciboUrl) {
    await setFaturaPagoComRecibo(supabase, faturaId, reciboUrl);
    return;
  }
  // 3) por fim, fallback gerando PDF próprio
  const { data: fRow } = await supabase.from("fatura").select("id,titulo,valor,moeda").eq("id", faturaId).single();
  if (fRow) {
    const url = await generateAndUploadReceiptPdf(supabase, fRow, chargeId);
    await setFaturaPagoComRecibo(supabase, faturaId, url);
  }
}
async function handleByInvoice(supabase, invoice) {
  // Só se a invoice tiver sido criada a partir do Checkout dessa fatura
  // (não confundir com subscrições fora do fluxo)
  const faturaId = invoice?.metadata?.fatura_id // se preencheres via invoice_creation.invoice_data.metadata
      ?? null;
  // Caso não tenhas setado metadata na invoice, podemos recuperar pelo PaymentIntent
  // (invoice.charge -> charge.payment_intent)
  if (!faturaId) {
    const chargeId = typeof invoice.charge === "string" ? invoice.charge : invoice.charge?.id;
    if (chargeId) {
      const ch = await stripe.charges.retrieve(chargeId, {
        expand: [
          "payment_intent"
        ]
      });
      const pi = ch.payment_intent;
      const maybe = pi?.metadata?.fatura_id ?? null;
      if (maybe) {
        // se já temos o PDF aqui, grava direto
        if (invoice.invoice_pdf) {
          await setFaturaPagoComRecibo(supabase, maybe, invoice.invoice_pdf);
          return;
        }
      }
    }
    // sem mapeamento, não há o que fazer
    return;
  }
  // Temos fatura_id mapeado — se já há o PDF, grava
  if (invoice.invoice_pdf) {
    await setFaturaPagoComRecibo(supabase, faturaId, invoice.invoice_pdf);
  }
}
/* --------------- ENTRYPOINT --------------- */ Deno.serve(async (req)=>{
  const sig = req.headers.get("stripe-signature");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!sig || !secret) return bad("Missing signature or secret");
  const raw = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, secret);
  } catch (err) {
    return bad(`Erro de verificação do webhook: ${err}`);
  }
  const supabase = createClient(Deno.env.get("PROJECT_URL"), Deno.env.get("SERVICE_ROLE_KEY"));
  try {
    switch(event.type){
        // eventos “rápidos”: marcam pago e tentam pegar recibo, mas NÃO forçam fallback se a invoice ainda não saiu
      case "checkout.session.completed":
      {
        const cs = event.data.object;
        if (cs.payment_intent) {
          const piId = typeof cs.payment_intent === "string" ? cs.payment_intent : cs.payment_intent.id;
          await handleByPaymentIntentId(supabase, piId, cs);
        }
        break;
      }
      case "payment_intent.succeeded":
      {
        const pi = event.data.object;
        await handleByPaymentIntentId(supabase, pi.id);
        break;
      }
        // eventos “tardios”: garantem o PDF oficial
      case "invoice.finalized":
      {
        const inv = event.data.object;
        await handleByInvoice(supabase, inv);
        break;
      }
      case "invoice.paid":
      {
        const inv = event.data.object;
        await handleByInvoice(supabase, inv);
        break;
      }
        // outros que não mexemos em recibo
      case "payment_intent.payment_failed":
      case "checkout.session.expired":
      case "charge.failed":
        break;
    }
    return ok();
  } catch (err) {
    return bad(`Erro no handler: ${String(err)}`);
  }
});
