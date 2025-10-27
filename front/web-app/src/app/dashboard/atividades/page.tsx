// app/atividades/page.tsx
import { createServerSupabase } from "@/api/Server";
import { ActivitiesList, type ActivityRow } from "@/components/myComponents/ActivitiesList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ActivityPage() {
  const supabase = await createServerSupabase();

  // ⚠️ Carrega um número razoável para não pesar o cliente; ajusta conforme o teu volume.
  // Ex.: últimos 500 eventos.
  const { data, error } = await supabase
    .from("activity_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[activity_feed]", error.message);
  }

  const items = (data ?? []) as ActivityRow[];

  return (
    <div className="p-5 max-w-3xl mx-auto mt-6 space-y-6">
      <ActivitiesList items={items} defaultPerPage={20} />
    </div>
  );
}
