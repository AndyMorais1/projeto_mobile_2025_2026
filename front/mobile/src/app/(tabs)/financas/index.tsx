import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";

export default function Financas() {
  const [activeTable, setActiveTable] = useState<"pagamentos" | "recibos">(
    "pagamentos"
  );

  // Dados vazios por enquanto
  const pagamentos: any[] = [
    {
      estado: "Pendente",
      descricao: "Condomínio Maio",
      limite: "2024-05-10",
      valor: "$ 500,00",
    },
  ];
  const recibos: any[] = [
    { data: "2024-05-05", descricao: "Recibo Condomínio Abril" },
  ];

  // Renderização de cada card de pagamento
  const renderPagamento = ({ item }: any) => (
    <View className="bg-gray-200 rounded-xl p-4 mb-4">
      <Text className="font-bold mb-1">Estado: {item.estado || "-"}</Text>
      <Text className="mb-1">Descrição: {item.descricao || "-"}</Text>
      <Text className="mb-1">Limite: {item.limite || "-"}</Text>
      <Text className="mb-1">Valor: {item.valor || "-"}</Text>
      <View className="flex-row space-x-2 mt-2">
        <TouchableOpacity className="bg-blue-500 px-3 py-1 rounded">
          <Text className="text-white font-semibold">Pagar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderização de cada card de recibo
  const renderRecibo = ({ item }: any) => (
    <View className="bg-gray-200 rounded-xl p-4 mb-4  ">
      <Text className="font-bold mb-1">Data: {item.data || "-"}</Text>
      <Text className="mb-1">Descrição: {item.descricao || "-"}</Text>
      <View className="flex-row space-x-2 mt-2">
        <TouchableOpacity className="bg-blue-500 px-3 py-1 rounded">
          <Text className="text-white font-semibold">Baixar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white pt-6 px-4">
      {/* Botões para alternar tabelas */}
      <View className="flex-row justify-around mb-6 ">
        <TouchableOpacity onPress={() => setActiveTable("pagamentos")}>
          <Text
            className={`text-lg font-semibold ${
              activeTable === "pagamentos" ? "text-blue-500" : "text-gray-500"
            }`}
          >
            Pagamentos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTable("recibos")}>
          <Text
            className={`text-lg font-semibold ${
              activeTable === "recibos" ? "text-blue-500" : "text-gray-500"
            }`}
          >
            Recibos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cards de Pagamentos */}
      {activeTable === "pagamentos" && (
        <FlatList
          data={pagamentos}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderPagamento}
          ListEmptyComponent={() => (
            <View className="items-center py-20">
              <Text className="text-gray-400">
                Nenhum pagamento registrado ainda
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Cards de Recibos */}
      {activeTable === "recibos" && (
        <FlatList
          data={recibos}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderRecibo}
          ListEmptyComponent={() => (
            <View className="items-center py-20">
              <Text className="text-gray-400">
                Nenhum recibo registrado ainda
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
