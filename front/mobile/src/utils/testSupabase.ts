import { supabase } from "../api/client";


export async function testarConexaoSupabase() {
    const { data, error } = await supabase.from("pedido").select("*").limit(1);

    if (error) {
        console.error("Erro ao conectar com Supabase:", error.message);
        return false;
    } else {
        console.log("Conectada ao Supabase com sucesso!");
        return true;
    }
}
