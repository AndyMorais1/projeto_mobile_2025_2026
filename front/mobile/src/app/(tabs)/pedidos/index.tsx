import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";

export default function PedidosScreen() {
  // Dados de exemplo
  const pedidos: any[] = [
    { 
      titulo: "Pedido 1", 
      descricao: "Descrição do Pedido 1", 
      estado: "Pendente", 
      data: "2024-06-01", 
      tipo: "Tipo A" 
    },
    { 
      titulo: "Pedido 2", 
      descricao: "Descrição do Pedido 2", 
      estado: "Pendente", 
      data: "2024-05-28", 
      tipo: "Tipo B" 
    },
  ];

  // Funções de exemplo para editar/apagar
  const handleEditar = (titulo: string) => {
    Alert.alert("Editar", `Editar ${titulo}`);
  };

  const handleApagar = (titulo: string) => {
    Alert.alert("Apagar", `Apagar ${titulo}?`);
  };

  // Renderização de cada card
  const renderCard = ({ item }: any) => (
    <View className="bg-gray-200 rounded-xl p-4 mb-8 ">
      <Text className="font-bold text-lg mb-1">{item.titulo}</Text>
      <Text className="text-gray-700 mb-1">{item.descricao}</Text>
      <Text className="text-gray-600 mb-1">Estado: {item.estado}</Text>
      <Text className="text-gray-600 mb-1">Data: {item.data}</Text>
      <Text className="text-gray-600 mb-2">Tipo: {item.tipo}</Text>

      {/* Botões de ação */}
      <View className="flex-row space-x-2 gap-2">
        <TouchableOpacity
          className="bg-yellow-400 px-3 py-1 rounded"
          onPress={() => handleEditar(item.titulo)}
        >
          <Text className="text-white font-semibold">Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-500 px-3 py-1 rounded"
          onPress={() => handleApagar(item.titulo)}
        >
          <Text className="text-white font-semibold">Apagar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white pt-6 px-4 ">
      {/* Cabeçalho com botão Novo Pedido */}
      <View className="flex-row justify-end items-center mb-14 ">
        <TouchableOpacity className="px-4 py-2 bg-blue-500 rounded flex-row items-center">
          <Text className="text-white font-semibold">Novo Pedido</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de pedidos em cards */}
      <FlatList
        data={pedidos}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderCard}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <View className="items-center py-20">
            <Text className="text-gray-400">Nenhum pedido registrado ainda</Text>
          </View>
        )}
      />
    </View>
  );
}
