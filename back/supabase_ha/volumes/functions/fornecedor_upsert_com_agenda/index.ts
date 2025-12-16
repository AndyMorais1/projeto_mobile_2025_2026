// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

/* =====================================================
   ENV — SUPABASE HA
===================================================== */
const PROJECT_URL = Deno.env.get("PROJECT_URL"); // http://kong:8000
const INTERNAL_AUTH_URL = Deno.env.get("INTERNAL_AUTH_URL"); // http://auth:9999
const ANON_KEY = Deno.env.get("ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

/* =====================================================
   CORS
===================================================== */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

/* =====================================================
   AUTH — GOTRUE INTERNO
===================================================== */
async function getUserFromJWT(authHeader: string) {
  if (!authHeader) return null;

  const res = await fetch(`${INTERNAL_AUTH_URL}/user`, {
    headers: { Authorization: authHeader },
  });

  if (!res.ok) return null;
  return await res.json();
}

/* =====================================================
   SUPABASE CLIENTS
===================================================== */
function supaUserClient(authHeader: string) {
  return createClient(PROJECT_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
}

function supaAdminClient() {
  return createClient(PROJECT_URL, SERVICE_ROLE_KEY);
}

/* =====================================================
   HELPERS
===================================================== */
function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60_000);
}

function parseISODateOrThrow(value: string, field: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error(`${field} deve ser YYYY-MM-DD`);

  const dt = new Date(`${value}T00:00:00`);
  if (isNaN(dt.getTime())) throw new Error(`${field} inválido`);

  return dt;
}

/* =====================================================
   MAIN
===================================================== */
serve(async (req) => {
  try {
    /* ================= CORS ================= */
    if (req.method === "OPTIONS")
      return new Response("ok", { headers: corsHeaders });

    if (req.method !== "POST")
      return json({ error: "Use POST" }, 405);

    /* ================= AUTH ================= */
    const authHeader = req.headers.get("Authorization") || "";
    const user = await getUserFromJWT(authHeader);

    if (!user?.id)
      return json({ error: "Não autenticado" }, 401);

    const supaUser = supaUserClient(authHeader);

    /* ================= PERMISSÃO (ADMIN) ================= */
    const { data: adminRow, error: adminErr } = await supaUser
      .from("admin")
      .select("id, estado_utilizador")
      .eq("id", user.id)
      .single();

    if (adminErr || !adminRow)
      return json({ error: "Acesso negado (não é admin)" }, 403);

    if (adminRow.estado_utilizador !== "ativo")
      return json({ error: "Admin inativo" }, 403);

    /* ================= BODY ================= */
    const bodyText = await req.text();
    if (!bodyText) return json({ error: "Body vazio" }, 400);

    const body = JSON.parse(bodyText);
    const { fornecedor, servicos, agenda } = body ?? {};

    if (!fornecedor?.nome?.trim())
      return json({ error: "Nome é obrigatório" }, 400);

    if (!agenda?.periodo_inicio || !agenda?.periodo_fim)
      return json({ error: "Período obrigatório" }, 400);

    if (!Array.isArray(agenda?.dias_semana) || agenda.dias_semana.length === 0)
      return json({ error: "dias_semana obrigatório" }, 400);

    if (!Array.isArray(agenda?.intervalos) || agenda.intervalos.length === 0)
      return json({ error: "intervalos obrigatório" }, 400);

    const periodoInicio = parseISODateOrThrow(
      agenda.periodo_inicio,
      "periodo_inicio",
    );
    const periodoFim = parseISODateOrThrow(
      agenda.periodo_fim,
      "periodo_fim",
    );

    if (periodoFim < periodoInicio)
      return json({ error: "periodo_fim < periodo_inicio" }, 400);

    const duracao = Number(fornecedor.duracao_slot_minutos ?? 60);
    if (!Number.isFinite(duracao) || duracao < 15 || duracao > 480)
      return json({ error: "duração inválida" }, 400);

    const supaAdmin = supaAdminClient();

    /* =====================================================
       1️⃣ UPSERT FORNECEDOR
    ===================================================== */
    const { data: fornecedorRow, error: fErr } = await supaAdmin
      .from("fornecedor")
      .upsert(
        {
          id: fornecedor.id ?? undefined,
          nome: fornecedor.nome.trim(),
          email: fornecedor.email ?? null,
          telefone: fornecedor.telefone ?? null,
          avaliacao_media: fornecedor.avaliacao_media ?? 0,
          duracao_slot_minutos: duracao,
          disponibilidade: true,
        },
        { onConflict: "id" },
      )
      .select()
      .single();

    if (fErr) throw fErr;

    const fornecedorId = fornecedorRow.id;

    /* =====================================================
       2️⃣ SERVIÇOS (REPLACE)
    ===================================================== */
    await supaAdmin
      .from("fornecedor_servico")
      .delete()
      .eq("fornecedor_id", fornecedorId);

    if (Array.isArray(servicos)) {
      const rows = servicos
        .filter((s) => s?.tipo_servico)
        .map((s) => ({
          fornecedor_id: fornecedorId,
          tipo_servico: s.tipo_servico,
          preco_medio: s.preco_medio ?? null,
        }));

      if (rows.length)
        await supaAdmin.from("fornecedor_servico").insert(rows);
    }

    /* =====================================================
       3️⃣ REGRAS (REPLACE)
    ===================================================== */
    await supaAdmin
      .from("fornecedor_disponibilidade_regra")
      .delete()
      .eq("fornecedor_id", fornecedorId);

    const regras = [];
    for (const dia of agenda.dias_semana) {
      for (const intervalo of agenda.intervalos) {
        regras.push({
          fornecedor_id: fornecedorId,
          dia_semana: dia,
          hora_inicio: intervalo.inicio,
          hora_fim: intervalo.fim,
        });
      }
    }

    if (!regras.length)
      return json({ error: "Nenhuma regra válida" }, 400);

    await supaAdmin
      .from("fornecedor_disponibilidade_regra")
      .insert(regras);

    /* =====================================================
       4️⃣ REGERAR SLOTS LIVRES FUTUROS
    ===================================================== */
    await supaAdmin
      .from("fornecedor_slot")
      .delete()
      .eq("fornecedor_id", fornecedorId)
      .eq("status", "livre")
      .gte("inicio", agenda.periodo_inicio);

    const slots = [];

    for (
      let dia = new Date(periodoInicio);
      dia <= periodoFim;
      dia.setDate(dia.getDate() + 1)
    ) {
      if (!agenda.dias_semana.includes(dia.getDay())) continue;

      for (const intervalo of agenda.intervalos) {
        const [hi, mi] = intervalo.inicio.split(":").map(Number);
        const [hf, mf] = intervalo.fim.split(":").map(Number);

        let cursor = new Date(dia);
        cursor.setHours(hi, mi, 0, 0);

        const fim = new Date(dia);
        fim.setHours(hf, mf, 0, 0);

        while (addMinutes(cursor, duracao) <= fim) {
          slots.push({
            fornecedor_id: fornecedorId,
            inicio: cursor.toISOString(),
            fim: addMinutes(cursor, duracao).toISOString(),
            status: "livre",
          });
          cursor = addMinutes(cursor, duracao);
        }
      }
    }

    for (let i = 0; i < slots.length; i += 1000) {
      await supaAdmin
        .from("fornecedor_slot")
        .insert(slots.slice(i, i + 1000));
    }

    /* ================= OK ================= */
    return json({
      ok: true,
      fornecedor_id: fornecedorId,
      regras: regras.length,
      slots: slots.length,
    });

  } catch (e) {
    console.error("Erro fornecedor_upsert:", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});
