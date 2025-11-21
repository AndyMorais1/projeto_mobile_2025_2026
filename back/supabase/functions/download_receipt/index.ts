// supabase/functions/download_receipt/index.ts
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "authorization,content-type"
  };
}
function json(body, status = 400) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders()
    });
  }
  const url = new URL(req.url);
  const faturaId = url.searchParams.get("fatura_id");
  if (!faturaId) return json({
    error: "missing fatura_id"
  }, 400);
  const SUPABASE_URL = Deno.env.get("PROJECT_URL");
  const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) return json({
    error: "server misconfig"
  }, 500);
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: f, error } = await supabase.from("fatura").select("id, titulo, recibo_url").eq("id", faturaId).single();
  if (error || !f) return json({
    error: "fatura not found"
  }, 404);
  if (!f.recibo_url) return json({
    error: "no receipt for this invoice"
  }, 404);
  const upstream = await fetch(f.recibo_url);
  if (!upstream.ok || !upstream.body) return json({
    error: "upstream error"
  }, 502);
  const filename = ((f.titulo || `recibo-${f.id}`) + ".pdf").replace(/[^\w\-\.]+/g, "_");
  const headers = new Headers(upstream.headers);
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Cache-Control", "private, max-age=300");
  Object.entries(corsHeaders()).forEach(([k, v])=>headers.set(k, v));
  return new Response(upstream.body, {
    status: 200,
    headers
  });
});
