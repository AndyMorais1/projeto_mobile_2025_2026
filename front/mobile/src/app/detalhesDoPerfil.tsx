import { useEffect, useState } from "react";
import { ScrollView, Alert, Text } from "react-native";
import { Stack, useRouter } from "expo-router";
import { UserInfo, DocumentosCard, LogoutButton } from "@/components/detalhesDoPerfil";
import { supabase } from "@/api/client";

export default function PerfilDetalhadoScreen() {
    const [user, setUser] = useState<any>(null);
    const [editavel, setEditavel] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchUser() {
            try {
                const { data: authData, error: authErr } = await supabase.auth.getUser();
                if (authErr) throw authErr;

                const authUser = authData?.user;
                if (!authUser) throw new Error("Sessão inválida");

                // ✅ 1) morador (SEM morada)
                const { data: moradorRow, error: moradorErr } = await supabase
                    .from("morador")
                    .select("nome, email, telefone, foto")
                    .eq("id", authUser.id)
                    .maybeSingle();

                if (moradorErr) throw moradorErr;

                const baseUser =
                    moradorRow ??
                    ({
                        nome: authUser.user_metadata?.nome ?? authUser.email?.split("@")[0] ?? "Utilizador",
                        email: authUser.email ?? "",
                        telefone: authUser.user_metadata?.telefone ?? "",
                        foto: authUser.user_metadata?.foto ?? null,
                    } as any);

                // ✅ 2) morada vem da propriedade.nome_propriedade
                const { data: props, error: propsErr } = await supabase
                    .from("propriedade")
                    .select("nome_propriedade")
                    .eq("morador_id", authUser.id);

                if (propsErr) throw propsErr;

                const moradas = (props ?? [])
                    .map((p: any) => p?.nome_propriedade)
                    .filter(Boolean);

                const moradaText = moradas.length ? moradas.join(" • ") : "—";

                // ✅ injetamos "morada" só para UI (não existe na tabela morador)
                setUser({ ...baseUser, morada: moradaText });
            } catch (err: any) {
                console.error("Erro ao carregar utilizador:", err?.message ?? err);
                Alert.alert("Erro", "Falha ao carregar dados do perfil.");
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    async function handleSave() {
        try {
            const { data: authData, error: authErr } = await supabase.auth.getUser();
            if (authErr) throw authErr;

            const authUser = authData?.user;
            if (!authUser) throw new Error("Sessão inválida");

            // ✅ atualiza APENAS campos que existem em morador
            const { error } = await supabase
                .from("morador")
                .update({
                    nome: user.nome,
                    telefone: user.telefone,
                    foto: user.foto ?? null,
                })
                .eq("id", authUser.id);

            if (error) throw error;

            Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
            setEditavel(false);
        } catch (err: any) {
            console.error("Erro ao atualizar perfil:", err?.message ?? err);
            Alert.alert("Erro", "Não foi possível atualizar o perfil.");
        }
    }

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            router.replace("/login");
        } catch (err: any) {
            console.error("Erro ao fazer logout:", err?.message ?? err);
            Alert.alert("Erro", "Falha ao encerrar a sessão.");
        }
    };

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
                contentContainerStyle={{ paddingTop: 30, paddingBottom: 100 }}
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

                {/* Se o teu LogoutButton já trata do logout, mantém. Se não, usa o handleLogout aqui */}
                <LogoutButton />
                {/* ou troca por:
            <Text onPress={handleLogout}>Logout</Text>
        */}
            </ScrollView>
        </>
    );
}
