// src/app/api/receipts/[faturaId]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

function jsonErr(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(req: NextRequest, { params }: { params: { faturaId: string } }) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // ✅ agora a sessão deve existir (middleware já refrescou)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonErr("Não autenticado", 401);

  const faturaId = params.faturaId;

  const { data: f } = await supabase
    .from("fatura")
    .select("id, titulo, recibo_url")
    .eq("id", faturaId)
    .single();

  if (!f) return jsonErr("Fatura não encontrada", 404);
  if (!f.recibo_url) return jsonErr("Recibo indisponível para esta fatura.", 404);

  const upstream = await fetch(f.recibo_url);
  if (!upstream.ok || !upstream.body) return jsonErr("Falha ao obter o recibo.", 502);

  const filename = (f.titulo || `recibo-${f.id}`).replace(/[^\w\-]+/g, "_") + ".pdf";

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
