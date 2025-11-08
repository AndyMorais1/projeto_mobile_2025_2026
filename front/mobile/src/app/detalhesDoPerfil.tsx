import { useEffect, useState} from "react";
import { ScrollView, Alert, Text } from "react-native";
import { Stack } from "expo-router";
import { UserInfo, DocumentosCard, LogoutButton } from "@/components/detalhesDoPerfil";
import { supabase } from "@/api/client";

export default function PerfilDetalhadoScreen() {
    const [user, setUser] = useState<any>(null);
    const [editavel, setEditavel] = useState(false);
    const [loading, setLoading] = useState(true);

    // ====================== Carregar dados do utilizador ======================
    useEffect(() => {
        async function fetchUser() {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) throw new Error("Sessão inválida");

                const { data, error } = await supabase
                    .from("morador")
                    .select("nome, morada, email, telefone, foto")
                    .eq("id", authUser.id)
                    .single();

                if (error) throw error;
                setUser(data);
            } catch (err: any) {
                console.error("Erro ao carregar utilizador:", err.message);
                Alert.alert("Erro", "Falha ao carregar dados do perfil.");
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    // ====================== Atualizar no Supabase ======================
    async function handleSave() {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error("Sessão inválida");

            const { error } = await supabase
                .from("morador")
                .update({
                    nome: user.nome,
                    morada: user.morada,
                    telefone: user.telefone,
                    foto: user.foto ?? null,
                })
                .eq("id", authUser.id);

            if (error) throw error;

            Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
            setEditavel(false);
        } catch (err: any) {
            console.error("Erro ao atualizar perfil:", err.message);
            Alert.alert("Erro", "Não foi possível atualizar o perfil.");
        }
    }

    // ====================== Interface ======================
    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Detalhes do perfil",
                    headerTitleAlign: "center",
                    headerRight: () =>
                        editavel ? (
                            <Text onPress={handleSave} className="text-blue-500 mr-4">
                                Guardar
                            </Text>
                        ) : null,
                }}
            />

            <ScrollView
                className="flex-1 bg-[#F3F4F6] px-6"
                contentContainerStyle={{
                    paddingTop: 30,
                    paddingBottom: 100,
                }}
                showsVerticalScrollIndicator={false}
            >
                {user && (
                    <UserInfo
                        user={user}
                        editavel={editavel}
                        onChange={setUser}
                        onSave={handleSave}
                        onEditAvatar={() => setEditavel(!editavel)}
                    />
                )}

                <DocumentosCard total={1} onPress={() => console.log("Abrir documentos")} />

                <LogoutButton onPress={() => console.log("Logout efetuado")} />
            </ScrollView>
        </>
    );
}
