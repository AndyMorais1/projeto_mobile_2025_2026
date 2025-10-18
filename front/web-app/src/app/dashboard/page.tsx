import { Cards } from "@/components/myComponents/Cards";
import { createServerSupabase } from "@/api/Server";
import { RecentNotifications, Notificacao } from "@/components/myComponents/RecentNotifications";

const notificacoesMock: Notificacao[] = [ 
  { id: "n1", titulo: "Fatura paga", mensagem: "A fatura FT 2025/123 foi paga pelo morador Ana Silva.", tipo: "sucesso", created_at: new Date(), lida: false, },
  { id: "n2", titulo: "Pedido de manutenção", mensagem: "Vazamento reportado no Bloco B, apto 302.", tipo: "alerta", created_at: new Date(Date.now() - 1000 * 60 * 30), lida: false, },
  { id: "n3", titulo: "Novo morador registado", mensagem: "Carlos Pereira foi adicionado ao Condomínio Jardim.", tipo: "info", created_at: new Date(Date.now() - 1000 * 60 * 90), lida: true, },
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

// util simples para contar registros com segurança
async function countTable(
  supabase: ReturnType<typeof createServerSupabase> extends Promise<infer C> ? C : never,
  table: string,
  filter?: (q: any) => any
): Promise<number> {
  // head:true evita transferir linhas, retorna só cabeçalhos e contagem
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) {
    // Loga no server e volta 0 para não quebrar o dashboard
    console.error(`[countTable] ${table}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const [
    moradores,
    pendingUsers,
    casas,
    condominios,
    pedidos,
  ] = await Promise.all([
    countTable(supabase, "morador"),
    countTable(supabase, "morador", (q) => q.eq("must_reset_password", true)),
    countTable(supabase, "propriedade"),
    countTable(supabase, "condominio"),
    countTable(supabase, "pedido"),
  ]);

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-6">
      <Cards
        moradores={moradores}
        casas={casas}
        condominios={condominios}
        pedidos={pedidos}
        pendingUsers={pendingUsers}
      />
      {/* Notificações recentes (abaixo dos cards) */} <div className="w-1/2"> <RecentNotifications notificacoes={notificacoesMock} /> {/* Ou passe um fetch: <RecentNotifications fetchNotificacoes={async () => { const { data, error } = await supabase .from('notificacoes') .select('*') .order('created_at', { ascending: false }) .limit(10); if (error) throw error; return data as Notificacao[]; }} /> */} </div>
    </div>
  );
}
