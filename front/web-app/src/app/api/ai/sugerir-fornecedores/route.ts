// app/api/ai/sugerir-fornecedores/route.ts (resumido)
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const { pedido_id, top_k = 3 } = await req.json();
  // 1) carregar pedido
  const { data: pedido } = await supabase.from("pedido").select("*").eq("id", pedido_id).single();
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  // 2) buscar fornecedores que oferecem a categoria
  const { data: servicos } = await supabase
    .from("fornecedor_servico")
    .select("*, fornecedor:fornecedor_id(*)")
    .eq("tipo_servico", pedido.categoria);

  const candidatos = (servicos ?? [])
    .map((s: any) => {
      const f = s.fornecedor;
      return {
        fornecedor_id: f.id,
        nome: f.nome,
        preco_medio: s.preco_medio ?? null,
        avaliacao: Number(f.avaliacao_media ?? 0),
        disponibilidade: Boolean(f.disponibilidade),
        // guardar a fonte do serviço (preco, tipo)
        _servico: s
      };
    })
    .filter((c: any) => c.disponibilidade) // restrição básica
    .filter((c: any) => !pedido.orcamento_max || (c.preco_medio !== null && c.preco_medio <= Number(pedido.orcamento_max)));

  // 3) scoring (normalizações simples)
  const maxPreco = Math.max(...candidatos.map((c:any)=> c.preco_medio ?? 0), 1);
  const maxAv = Math.max(...candidatos.map((c:any)=> c.avaliacao ?? 0), 5);

  const scored = candidatos.map((c:any) => {
    const precoNorm = c.preco_medio ? (c.preco_medio / maxPreco) : 0.5;
    const avNorm = (c.avaliacao / (maxAv || 5));
    // exemplo de pesos
    const score = (0.5 * (1 - precoNorm)) + (0.45 * avNorm) + (pedido.urgencia === 'alta' ? 0.05 : 0);
    const justificativa = `Preço ${c.preco_medio ?? 'N/D'} • Aval: ${c.avaliacao}`;
    return { ...c, score: Number(score.toFixed(3)), justificativa };
  }).sort((a:any,b:any)=> b.score - a.score).slice(0, top_k);

  // 4) gravar log (opcional)
  await supabase.from("ai_sugestoes").insert([{ pedido_id, sugestoes: scored }]);

  return NextResponse.json({ pedido_id, sugestoes: scored });
}
