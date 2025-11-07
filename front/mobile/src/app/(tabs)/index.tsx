import { useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { Header } from "@/components/header";
import {
    QuickActions,
    CardDeNotificacoes,
    CarroselDeAnuncios,
    ModalDeAnuncios,
} from "@/components/home";

export default function HomeScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [anuncioSelecionado, setAnuncioSelecionado] = useState<any>(null);
    const usuario = "Carla";


    const anuncios = [
        {
            id: 1,
            titulo: "Reunião do condomínio",
            descricao:
                "Dia 15/10 às 20h no salão de festas. Tragam suas sugestões e participem!",
            imagem: "https://picsum.photos/600/300?random=12",
        },
        {
            id: 2,
            titulo: "Manutenção da piscina",
            descricao:
                "A piscina estará interditada para manutenção até 20/10. Agradecemos a compreensão.",
            imagem: "https://picsum.photos/600/300?random=10",
        },
        {
            id: 3,
            titulo: "Feira de garagem",
            descricao:
                "Dia 25/10 no pátio. Traga itens que deseja vender ou doar. Vamos participar!",
            imagem: "https://picsum.photos/600/300?random=14",
        },
    ];

    return (
        <ScrollView className="flex-1 bg-white">
            {/* Saudação abaixo do header */}
            <View className="w-full py-8 px-6">
                <Text className="text-3xl font-extrabold text-blue-500 mb-1">
                    Bem-vindo(a), {usuario}
                </Text>
                <Text className="text-xl font-medium text-gray-500">
                    O teu condomínio em um lugar só
                </Text>
            </View>

            {/* Conteúdo principal */}
            <QuickActions valor={250} pedidos={5} />
            <CardDeNotificacoes />
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
