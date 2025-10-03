import { View, Text, FlatList } from "react-native";

export default function InfopointScreen() {
  // Dados de exemplo
  const noticias = [
    { id: "1", titulo: "Nova área de lazer inaugurada" },
    { id: "2", titulo: "Assembleia marcada para 05/06" },
  ];

  const avisos = [
    { id: "1", titulo: "Manutenção do elevador amanhã" },
    { id: "2", titulo: "Recolhimento de lixo orgânico atrasado" },
  ];

  // Renderização de cada card
  const renderItem = ({ item }: any) => (
    <View className="bg-gray-100 rounded-lg p-4 mb-3 shadow">
      <Text className="font-semibold">{item.titulo}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-white px-4 py-6">
      {/* Área de Notícias */}
      <Text className="text-xl font-bold mb-3">Notícias</Text>
      <FlatList
        data={noticias}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <Text className="text-gray-400 mb-4">Nenhuma notícia disponível</Text>
        )}
      />

      {/* Área de Avisos */}
      <Text className="text-xl font-bold  mb-3">Avisos</Text>
      <FlatList
        data={avisos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <Text className="text-gray-400">Nenhum aviso disponível</Text>
        )}
      />
    </View>
  );
}
