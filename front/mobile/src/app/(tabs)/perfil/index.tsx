import { View, Text } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { UserCard, SettingsList } from "@/components/perfil";
import { supabase } from "@/api/client";

export default function PerfilScreen() {
    const router = useRouter();

    const [utilizador, setUtilizador] = useState<any>(null);
    const [morada, setMorada] = useState<string>("—");
    const [loading, setLoading] = useState(true);

    const [notificacoesAtivas, setNotificacoesAtivas] = useState(false);
    const [temaClaro, setTemaClaro] = useState(true);

    useEffect(() => {
        async function fetchUserData() {
            try {
                const { data: auth, error: userError } = await supabase.auth.getUser();
                if (userError) {
                    console.log("❌ auth.getUser error:", userError);
                    throw userError;
                }
                const user = auth?.user;
                if (!user) throw new Error("Sessão inválida (sem user).");

                console.log("✅ auth user.id:", user.id, "email:", user.email);

                // ===== 1) MORADOR: tenta por id, se não encontrar tenta por morador_id =====
                let moradorRow: any = null;

                // tentativa A: morador.id == user.id
                {
                    const { data, error } = await supabase
                        .from("morador")
                        .select("nome, email, telefone, foto")
                        .eq("id", user.id)
                        .maybeSingle();

                    if (error) console.log("❌ morador (id) error:", error);
                    if (data) moradorRow = data;
                }

                // tentativa B: morador.morador_id == user.id (caso a tua coluna seja morador_id)
                if (!moradorRow) {
                    const { data, error } = await supabase
                        .from("morador")
                        .select("nome, email, telefone, foto")
                        .eq("morador_id", user.id)
                        .maybeSingle();

                    if (error) console.log("❌ morador (morador_id) error:", error);
                    if (data) moradorRow = data;
                }

                // fallback: se não encontrou linha em morador, usa info do auth
                if (!moradorRow) {
                    console.log("⚠️ Não encontrei linha em 'morador' para este user. Vou usar fallback do Auth.");
                    moradorRow = {
                        nome: user.user_metadata?.nome ?? user.email?.split("@")[0] ?? "Utilizador",
                        email: user.email ?? null,
                        telefone: user.user_metadata?.telefone ?? null,
                        foto: user.user_metadata?.foto ?? null,
                    };
                }

                setUtilizador(moradorRow);

                // ===== 2) MORADA: vem da propriedade.nome_propriedade =====
                const { data: props, error: propsError } = await supabase
                    .from("propriedade")
                    .select("nome_propriedade")
                    .eq("morador_id", user.id);

                if (propsError) {
                    console.log("❌ propriedade error:", propsError);
                } else {
                    const moradas = (props ?? [])
                        .map((p: any) => p?.nome_propriedade)
                        .filter(Boolean);

                    setMorada(moradas.length ? moradas.join(" • ") : "—");
                }
            } catch (err: any) {
                console.log("🔥 Erro geral no Perfil:", err?.message ?? err);
                setUtilizador(null);
            } finally {
                setLoading(false);
            }
        }

        fetchUserData();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>A carregar...</Text>
            </View>
        );
    }

    if (!utilizador) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>Erro ao carregar utilizador.</Text>
                <Text className="text-gray-500 mt-2">
                    Vê o console: deve aparecer o motivo (RLS/coluna errada/etc).
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white px-8 py-8">
            <UserCard
                nome={utilizador.nome}
                bloco={morada}
                foto={utilizador.foto}
                onPress={() => router.push("/detalhesDoPerfil")}
            />

            <SettingsList
                notificacoes={notificacoesAtivas}
                onToggleNotificacoes={setNotificacoesAtivas}
                tema={temaClaro ? "Claro" : "Escuro"}
                onToggleTema={() => setTemaClaro(!temaClaro)}
                lingua={"PT-PT"}
                onPressSeguranca={() => console.log("Abrir segurança")}
                onPressAjuda={() => console.log("Abrir ajuda")}
                onPressContactos={() => console.log("Abrir contactos")}
                onPressPrivacidade={() => console.log("Abrir políticas de privacidade")}
            />
        </View>
    );
}
