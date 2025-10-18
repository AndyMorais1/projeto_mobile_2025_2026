import { redirect } from "next/navigation";
import { createServerSupabase } from "../api/Server";

export default async function Home() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // se logado, vai pro dashboard
  if (user) redirect("/dashboard");

  // senão, vai pro login
  redirect("/login");
}
