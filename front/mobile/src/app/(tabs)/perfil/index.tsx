import { View, Text } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { UserCard, SettingsList } from "@/components/perfil";
import { supabase } from "@/api/client";

export default function PerfilScreen() {
    const router = useRouter();

    // ====================== ESTADOS ======================
    const [utilizador, setUtilizador] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notificacoesAtivas, setNotificacoesAtivas] = useState(false);
    const [temaClaro, setTemaClaro] = useState(true);

    // ====================== BUSCAR DADOS ======================
    useEffect(() => {
        async function fetchUserData() {
            try {
                // pegar utilizador autenticado
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) throw new Error("Sessão inválida");

                // pega dados da tabela morador
                const { data, error } = await supabase
                    .from("morador")
                    .select("nome, morada, email, telefone, foto")
                    .eq("id", user.id)
                    .single();

                if (error) throw error;

                // atualizar estado
                setUtilizador(data);
            } catch (err: any) {
                console.error("Erro ao carregar perfil:", err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchUserData();
    }, []);

    // ====================== ESTADO DE CARREGAMENTO ======================
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
            </View>
        );
    }

    // ====================== INTERFACE ======================
    return (
        <View className="flex-1 bg-white px-8 py-8">
            {/* Card do utilizador */}
            <UserCard
                nome={utilizador.nome}
                bloco={utilizador.morada}
                foto={utilizador.foto}
                onPress={() => router.push("/detalhesDoPerfil")}
            />

            {/* Lista de definições / opções */}
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
