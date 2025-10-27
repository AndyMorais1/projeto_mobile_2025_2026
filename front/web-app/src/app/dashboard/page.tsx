import { Cards } from "@/components/myComponents/Cards";
import { createServerSupabase } from "@/api/Server";
import { RecentActivity, type ActivityItem } from "@/components/myComponents/RecentNotifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// util simples para contar registros com segurança
async function countTable(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  table: string,
  filter?: (q: any) => any
): Promise<number> {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) {
    console.error(`[countTable] ${table}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

// busca atividade recente (servidor)
async function fetchRecentActivityServer(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  limitPerTable = 6
): Promise<ActivityItem[]> {
  const [mor, prop, cond] = await Promise.all([
    supabase
      .from("morador")
      .select("id, nome, created_at")
      .order("created_at", { ascending: false })
      .limit(limitPerTable),

    supabase
      .from("propriedade")
      .select("id, tipo_propriedade, rua, numero, andar, created_at")
      .order("created_at", { ascending: false })
      .limit(limitPerTable),

    supabase
      .from("condominio")
      .select("id, nome, endereco, created_at")
      .order("created_at", { ascending: false })
      .limit(limitPerTable),
  ]);

  if (mor.error) throw mor.error;
  if (prop.error) throw prop.error;
  if (cond.error) throw cond.error;

  const Mor: ActivityItem[] = (mor.data ?? []).map((m: any) => ({
    id: m.id,
    tipo: "morador",
    titulo: m.nome,
    detalhe: "Novo morador",
    created_at: m.created_at,
  }));

  const Prop: ActivityItem[] = (prop.data ?? []).map((p: any) => ({
    id: p.id,
    tipo: "propriedade",
    titulo: p.tipo_propriedade,
    detalhe: [p.rua, p.numero && `nº ${p.numero}`, p.andar && `andar ${p.andar}`]
      .filter(Boolean)
      .join(", "),
    created_at: p.created_at,
  }));

  const Cond: ActivityItem[] = (cond.data ?? []).map((c: any) => ({
    id: c.id,
    tipo: "condominio",
    titulo: c.nome,
    detalhe: c.endereco,
    created_at: c.created_at,
  }));

  // ordena no servidor e limita o total (ex.: 8)
  return [...Mor, ...Prop, ...Cond]
    .sort(
      (a, b) =>
        new Date(b.created_at as any).getTime() -
        new Date(a.created_at as any).getTime()
    )
    .slice(0, 8);
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase();

  const [moradores, pendingUsers, casas, condominios, pedidos, atividades] =
    await Promise.all([
      countTable(supabase, "morador"),
      countTable(supabase, "morador", (q) => q.eq("must_reset_password", true)),
      countTable(supabase, "propriedade"),
      countTable(supabase, "condominio"),
      countTable(supabase, "pedido"),
      fetchRecentActivityServer(supabase),
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* mantém espaço para outros cards futuros; por enquanto só a atividade */}
        <RecentActivity atividades={atividades} limit={7} />
      </div>
    </div>
  );
}
