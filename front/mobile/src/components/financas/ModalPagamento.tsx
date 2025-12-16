import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Modal,
    View,
    Text,
    TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/api/client";

interface ModalPagamentoProps {
    visible: boolean;
    onClose: () => void;
    valor?: number;
    descricao?: string;
    faturaId: string;
    onPaid?: () => void;
}

export default function ModalPagamento({
                                           visible,
                                           onClose,
                                           valor,
                                           descricao,
                                           faturaId,
                                           onPaid,
                                       }: ModalPagamentoProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!visible || !faturaId) return;

        const channel = supabase
            .channel(`fatura-mobile:${faturaId}`)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "fatura", filter: `id=eq.${faturaId}` },
                (payload) => {
                    const novo = payload.new as any;
                    if (novo?.estado_fatura === "pago") {
                        setStatus("Pagamento confirmado ✅");
                        onPaid?.();
                        onClose();
                    }
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [visible, faturaId, onClose, onPaid]);

    async function handleConfirm() {
        if (!faturaId || loading) return;

        try {
            setLoading(true);
            setStatus(null);

            const { data, error } = await supabase.functions.invoke("create_checkout_session", {
                body: { fatura_id: faturaId },
            });

            console.log("create_checkout_session -> data:", data, "error:", error);

            if (error) {
                const ctx: any = (error as any).context;
                if (ctx?.json) {
                    const body = await ctx.json();
                    setStatus(body?.error ?? error.message ?? "Falha ao iniciar checkout.");
                } else {
                    setStatus((error as any)?.message ?? "Falha ao iniciar checkout.");
                }
                return;
            }

            const url = data?.url;
            if (!url) {
                setStatus("Checkout URL não veio do servidor.");
                return;
            }

            setStatus("A abrir pagamento…");


            await WebBrowser.openBrowserAsync(url);


            setStatus("");
        } catch (e: any) {
            console.error("Erro no checkout:", e);
            setStatus(e?.message || "Erro ao iniciar pagamento.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-center items-center bg-black/40 px-4"
                >
                    <View className="bg-white rounded-2xl w-full p-5">
                        {/* Cabeçalho */}
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-lg font-bold text-blue-600">Pagamento</Text>
                            <TouchableOpacity
                                accessibilityLabel="Fechar"
                                onPress={onClose}
                                className="p-1 rounded-full active:opacity-80"
                                disabled={loading}
                            >
                                <Feather name="x" size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Resumo */}
                        <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                            <Text className="text-gray-500 text-sm">Descrição</Text>
                            <Text className="text-gray-800 font-semibold mb-2">
                                {descricao || "Pagamento de condomínio"}
                            </Text>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-gray-500 text-sm">Valor</Text>
                                <Text className="text-blue-600 font-extrabold text-xl">
                                    {valor != null ? `€ ${valor.toFixed(2)}` : "—"}
                                </Text>
                            </View>
                        </View>

                        <Text className="text-gray-800 font-semibold mb-2">
                            Ao carregar em pagar será redicionado para uma pagina externa para concluir o pagamento.
                        </Text>
                        <Text className="text-gray-500 text-m">
                            Desde já pedir desculpas pelo inconveniente.
                        </Text>

                        {status && <Text className="text-gray-600 text-xs mt-3">{status}</Text>}

                        {/* Ações */}
                        <View className="flex-row justify-end gap-3 mt-5">
                            <TouchableOpacity
                                onPress={onClose}
                                className="px-4 py-3 rounded-xl bg-gray-100 active:opacity-80"
                                disabled={loading}
                            >
                                <Text className="text-gray-700 font-medium">Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleConfirm}
                                disabled={loading}
                                className={`px-5 py-3 rounded-xl ${!loading ? "bg-blue-500" : "bg-blue-300"}`}
                            >
                                <Text className="text-white font-semibold">
                                    {loading ? "A iniciar…" : "Pagar"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
