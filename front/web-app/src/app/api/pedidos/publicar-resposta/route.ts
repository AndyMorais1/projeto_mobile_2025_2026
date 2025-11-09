// app/api/pedidos/publicar-resposta/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const { pedido_id, fornecedor_id, data_prevista, hora_prevista, resposta_text } = await req.json();
  const updates: any = { fornecedor_id, estado_pedido: 'aprovado', updated_at: new Date().toISOString() };
  if (data_prevista) updates.data_prevista = data_prevista;
  if (hora_prevista) updates.hora_prevista = hora_prevista;
  if (resposta_text) updates.resposta = resposta_text;

  const { error } = await supabase.from("pedido").update(updates).eq("id", pedido_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
