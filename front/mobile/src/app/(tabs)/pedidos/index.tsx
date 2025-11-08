import { useState } from "react";
import { View } from "react-native";
import { AdicionarPedidoSection, PedidosListSection } from "@/components/pedidos";

import { useEffect } from "react";
import { testarConexaoSupabase } from "@/utils/testSupabase";

// eslint-disable-next-line react-hooks/rules-of-hooks
useEffect(() => {
    testarConexaoSupabase();
}, []);


export default function PedidosScreen() {

    // ========================== DADOS SIMULADOS ==========================
    const [pedidos, setPedidos] = useState([
        {
            titulo: "Colocar Cerca Elétrica",
            estado: "Pendente",
            data: "18-11-2025",
            tipo: "Manutenção",
        },
        {
            titulo: "Manutenção da pia",
            estado: "Aprovado",
            data: "18-11-2025",
            tipo: "Manutenção",
            temResposta: true,
            respostaAdmin: "O eletricista passará amanhã às 10h.",
        },
        {
            titulo: "Jardineiro",
            estado: "Concluido",
            data: "10-09-2025",
            tipo: "Manutenção",
        },
        {   titulo: "Reparar portão",
            estado: "Rejeitado",
            data: "05-10-2025",
            tipo: "Manutenção" },
    ]);

    // ========================== AÇÕES ==========================
    const handleAdicionar = (novoPedido: any) => {
        setPedidos((prev) => [...prev, novoPedido]);
    };

    const handleApagar = (titulo: string) => {
        setPedidos((prev) => prev.filter((p) => p.titulo !== titulo));
    };

    const handleEditar = (titulo: string, novosDados: any) => {
        setPedidos((prev) =>
            prev.map((p) => (p.titulo === titulo ? { ...p, ...novosDados } : p))
        );
    };

    // ========================== INTERFACE ==========================
    return (
        <View className="flex-1 bg-white pt-6 px-4">
            {/* Seção para adicionar novos pedidos */}
            <AdicionarPedidoSection onAdd={handleAdicionar} />

            {/* Seção para listar pedidos existentes */}
            <PedidosListSection
                pedidos={pedidos}
                onDelete={handleApagar}
                onEdit={handleEditar}
            />
        </View>
    );
}
