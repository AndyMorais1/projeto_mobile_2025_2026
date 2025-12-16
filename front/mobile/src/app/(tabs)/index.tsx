import { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { Header } from "@/components/header";
import {
    QuickActions,
    CardDeNotificacoes,
    CarroselDeAnuncios,
    ModalDeAnuncios,
} from "@/components/home";
import { supabase } from "@/api/client";
import type { Anuncio } from "@/components/home/CarroselDeAnuncios";

type ContatoCondominio = {
    telefone: string;
    entidade: string;
};

type InfoItem = {
    id: string;
    titulo: string;
    descricao?: string | null;
    foto?: string | null;
    tipo_informacao?: string | null;
    estado_informacao?: string | null;
    condominio_id?: string | null;
    created_at?: string | null;
};

export default function HomeScreen() {
    // ====================== ESTADOS ======================
    const [modalVisible, setModalVisible] = useState(false);
    const [anuncioSelecionado, setAnuncioSelecionado] = useState<Anuncio | null>(
        null
    );

    const [nomeUser, setNomeUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const [valorPendente, setValorPendente] = useState<number>(0);
    const [pedidosPendentes, setPedidosPendentes] = useState<number>(0);
    const [contatosCondominio, setContatosCondominio] = useState<
        ContatoCondominio[]
    >([]);

    const [aviso, setAviso] = useState<InfoItem | null>(null);
    const [anuncios, setAnuncios] = useState<Anuncio[]>([]);

    // ====================== CARREGAR DADOS DO UTILIZADOR / HOME ======================
    useEffect(() => {
        async function carregarDados() {
            setLoading(true);
            setErro(null);

            try {
                // 1) utilizador autenticado
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();
                if (userError) throw userError;
                if (!user) {
                    setErro("Sessão inválida.");
                    setLoading(false);
                    return;
                }

                // 2) nome do morador
                const { data: morador, error: moradorError } = await supabase
                    .from("morador")
                    .select("nome")
                    .eq("id", user.id)
                    .maybeSingle();

                if (moradorError) throw moradorError;
                setNomeUser(morador?.nome ?? null);

                // 3) propriedades do morador (para saber condomínio e faturas)
                const { data: props, error: propsError } = await supabase
                    .from("propriedade")
                    .select("id, condominio_id")
                    .eq("morador_id", user.id);

                if (propsError) throw propsError;

                const propriedadeIds = (props ?? []).map((p: any) => p.id);
                const condominioIds = (props ?? [])
                    .map((p: any) => p.condominio_id)
                    .filter(Boolean);

                // 4) faturas dessas propriedades -> valor pendente
                let totalPendente = 0;
                if (propriedadeIds.length > 0) {
                    const { data: faturas, error: fatError } = await supabase
                        .from("fatura")
                        .select("valor, estado_fatura, propriedade_id")
                        .in("propriedade_id", propriedadeIds);

                    if (fatError) throw fatError;

                    (faturas ?? []).forEach((f: any) => {
                        if ((f.estado_fatura || "").toLowerCase() === "pendente") {
                            const v = Number(f.valor ?? 0);
                            if (Number.isFinite(v)) totalPendente += v;
                        }
                    });
                }
                setValorPendente(totalPendente);

                // 5) pedidos pendentes desse morador
                const { data: pedidos, error: pedError } = await supabase
                    .from("pedido")
                    .select("id, estado_pedido")
                    .eq("morador_id", user.id);

                if (pedError) throw pedError;

                const qtdPendentes = (pedidos ?? []).filter(
                    (p: any) => (p.estado_pedido || "").toLowerCase() === "pendente"
                ).length;
                setPedidosPendentes(qtdPendentes);

                // 6) contactos do condomínio (pega o primeiro condomínio ligado ao morador)
                let condominioId: string | null = null;
                if (condominioIds.length > 0) {
                    condominioId = condominioIds[0];

                    const { data: contatos, error: contatoError } = await supabase
                        .from("contato_condominio")
                        .select("telefone, entidade")
                        .eq("condominio_id", condominioId);

                    if (contatoError) throw contatoError;

                    setContatosCondominio(
                        (contatos ?? []).map((c: any) => ({
                            telefone: c.telefone,
                            entidade: c.entidade,
                        }))
                    );
                } else {
                    setContatosCondominio([]);
                }

                // 7) info (avisos + anúncios) do condomínio
                if (condominioId) {
                    const { data: infos, error: infoError } = await supabase
                        .from("info")
                        .select(
                            "id, titulo, descricao, foto, tipo_informacao, estado_informacao, condominio_id, created_at"
                        )
                        .eq("condominio_id", condominioId)
                        .eq("estado_informacao", "ativo")
                        .order("created_at", { ascending: false });

                    if (infoError) throw infoError;

                    const lista = (infos ?? []) as InfoItem[];

                    // Aviso: pega o mais recente tipo "aviso"
                    const avisos = lista.filter(
                        (i) => (i.tipo_informacao || "").toLowerCase() === "aviso"
                    );
                    setAviso(avisos[0] ?? null);

                    // Anúncios: tipo "noticias"
                    const noticias = lista.filter(
                        (i) => (i.tipo_informacao || "").toLowerCase() === "noticias"
                    );

                    setAnuncios(
                        noticias.map((n) => ({
                            id: n.id,
                            titulo: n.titulo,
                            descricao: n.descricao ?? "",
                            imagem:
                                n.foto ||
                                "https://picsum.photos/600/300?random=42", // fallback
                        }))
                    );
                } else {
                    setAviso(null);
                    setAnuncios([]);
                }
            } catch (e: any) {
                console.error("Erro ao carregar home:", e);
                setErro(e?.message || "Erro ao carregar dados.");
                setNomeUser(null);
                setValorPendente(0);
                setPedidosPendentes(0);
                setContatosCondominio([]);
                setAviso(null);
                setAnuncios([]);
            } finally {
                setLoading(false);
            }
        }

        void carregarDados();
    }, []);

    // ====================== INTERFACE ======================
    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="mt-4 text-gray-500">A carregar...</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white">
            {/* <Header /> se quiseres mostrar o header aqui */}

            {/* Saudação abaixo do header */}
            <View className="w-full py-8 px-6">
                <Text className="text-3xl font-extrabold text-blue-500 mb-1">
                    Bem-vindo(a), {nomeUser || "Utilizador"}
                </Text>
                <Text className="text-xl font-medium text-gray-500">
                    O teu condomínio num só lugar
                </Text>
                {erro && (
                    <Text className="mt-2 text-sm text-red-500">
                        {erro}
                    </Text>
                )}
            </View>

            {/* Conteúdo principal */}
            <QuickActions
                valor={valorPendente}
                pedidos={pedidosPendentes}
                contatos={contatosCondominio}
            />

            <CardDeNotificacoes aviso={aviso} />

            <CarroselDeAnuncios
                anuncios={anuncios}
                onSelect={(item) => {
                    setAnuncioSelecionado(item);
                    setModalVisible(true);
                }}
            />

            <ModalDeAnuncios
                visible={modalVisible}
                anuncio={anuncioSelecionado}
                onClose={() => setModalVisible(false)}
            />
        </ScrollView>
    );
}
