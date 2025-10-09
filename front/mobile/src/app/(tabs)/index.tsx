import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const usuario = "José";
  const ValorAPagar = 250;
  const QuantidadeDePedidos = 5;
  const router = useRouter();

  const anuncios = [
    {
      id: 1,
      titulo: "Reunião do condomínio",
      descricao: "Dia 15/10 às 20h no salão de festas. Tragam suas sugestões e participem!",
      imagem: "https://picsum.photos/600/300?random=12",
    },
    {
      id: 2,
      titulo: "Manutenção da piscina",
      descricao: "A piscina estará interditada para manutenção até 20/10. Agradecemos a compreensão.",
      imagem: "https://picsum.photos/600/300?random=10",
    },
    {
      id: 3,
      titulo: "Feira de garagem",
      descricao: "Dia 25/10 no pátio. Traga itens que deseja vender ou doar. Vamos participar!",
      imagem: "https://picsum.photos/600/300?random=14",
    },
    {
      id: 4,
      titulo: "Novo sistema de segurança",
      descricao: "Instalação de câmeras e melhorias na iluminação. Segurança reforçada para todos.",
      imagem: "https://picsum.photos/600/300?random=19",
    },
  ];

  const { width } = Dimensions.get("window");

  const [modalVisible, setModalVisible] = useState(false);
  const [anuncioSelecionado, setAnuncioSelecionado] = useState<any>(null);

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="w-full py-8 px-6">
        <Text className="text-3xl font-extrabold text-blue-500 mb-1">
          Bem-vindo(a), {usuario}
        </Text>
        <Text className="text-xl font-semibold text-gray-500">
          O teu condomínio em um lugar só
        </Text>
      </View>

      {/* Cards */}
      <View className="p-4 flex-row justify-center gap-6">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/financas")}
          className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
        >
          <Text className="text-gray-500 text-base font-bold mb-2">
            Divida mensal
          </Text>
          <Text className="text-3xl font-bold text-blue-500">
            {ValorAPagar.toFixed(2).replace(".", ",")} €
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/pedidos")}
          className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
        >
          <Text className="text-gray-500 text-base font-bold mb-2">
            Pedidos pendentes
          </Text>
          <Text className="text-3xl font-bold text-green-500">
            {QuantidadeDePedidos} pedidos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Carrossel de Anúncios */}
      <View className="p-4 mt-6">
        <Text className="text-lg font-bold mb-6 ">
          Anúncios do Condomínio
        </Text>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {anuncios.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => {
                setAnuncioSelecionado(item);
                setModalVisible(true);
              }}
            >
              <View
                style={{ width: width - 38 }}
                className="bg-gray-100 rounded-2xl mr-4 shadow-md border border-gray-200 overflow-hidden"
              >
                <Image
                  source={{ uri: item.imagem }}
                  style={{ width: "100%", height: 150 }}
                  resizeMode="cover"
                />
                <View className="p-4">
                  <Text className="text-2xl font-bold text-blue-500 mb-1">
                    {item.titulo}
                  </Text>
                  <Text className="text-gray-600 number-of-lines-2">
                    {item.descricao}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modal de detalhes do anúncio */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-black/25 px-6">
            <TouchableWithoutFeedback>
              <View className="bg-gray-100 w-full rounded-2xl overflow-hidden shadow-lg">
                {anuncioSelecionado && (
                  <>
                    <Image
                      source={{ uri: anuncioSelecionado.imagem }}
                      style={{ width: "100%", height: 200 }}
                      resizeMode="cover"
                    />
                    <View className="p-6">
                      <Text className="text-2xl font-bold text-blue-500 mb-3">
                        {anuncioSelecionado.titulo}
                      </Text>
                      <Text className="text-gray-700 text-base leading-relaxed">
                        {anuncioSelecionado.descricao}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}
