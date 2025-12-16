// supabase/functions/download_receipt/index.ts
// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/* =====================================================
   CORS
===================================================== */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function json(body: any, status = 400) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

/* =====================================================
   MAIN HANDLER
===================================================== */
Deno.serve(async (req) => {
  try {
    /* --------------------------------------------------
       OPTIONS (CORS)
    -------------------------------------------------- */
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "GET") {
      return json({ error: "Use GET" }, 405);
    }

    /* --------------------------------------------------
       Query Param
    -------------------------------------------------- */
    const url = new URL(req.url);
    const fatura_id = url.searchParams.get("fatura_id");

    if (!fatura_id) {
      return json({ error: "missing fatura_id" }, 400);
    }

    /* --------------------------------------------------
       ENV
    -------------------------------------------------- */
    const PROJECT_URL = Deno.env.get("PROJECT_URL"); // http://kong:8000
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

    if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
      return json({ error: "Server Misconfig: Missing PROJECT_URL/SERVICE_ROLE_KEY" }, 500);
    }

    /* --------------------------------------------------
       Supabase (Admin)
    -------------------------------------------------- */
    const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

    const { data: f, error } = await supabase
        .from("fatura")
        .select("id, titulo, recibo_url")
        .eq("id", fatura_id)
        .single();

    if (error || !f) {
      return json({ error: "fatura not found" }, 404);
    }

    if (!f.recibo_url) {
      return json({ error: "no receipt available for this invoice" }, 404);
    }

    /* --------------------------------------------------
       Fetch do PDF no Storage / Externo
    -------------------------------------------------- */
    const upstream = await fetch(f.recibo_url);

    if (!upstream.ok || !upstream.body) {
      return json({ error: "failed to fetch receipt" }, 502);
    }

    /* --------------------------------------------------
       Sanitizar filename (muito importante no HA)
    -------------------------------------------------- */
    const safeTitle = (f.titulo || `recibo-${f.id}`)
        .replace(/[^\w\-\.]+/g, "_")
        .substring(0, 64); // limitar para reduzir risco de erro

    const filename = `${safeTitle}.pdf`;

    /* --------------------------------------------------
       Construção da Resposta PDF
    -------------------------------------------------- */
    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
      ...corsHeaders,
    });

    return new Response(upstream.body, { status: 200, headers });

  } catch (e) {
    console.error("ERROR download_receipt:", e);
    return json({ error: String(e) }, 500);
  }
});
