import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
} from "react-native";

export interface Anuncio {
    id: string;
    titulo: string;
    descricao: string;
    imagem?: string | null;
}

interface Props {
    anuncios: Anuncio[];
    onSelect: (item: Anuncio) => void;
}

export default function CarroselDeAnuncios({ anuncios, onSelect }: Props) {
    const { width } = Dimensions.get("window");

    if (!anuncios || anuncios.length === 0) {
        return (
            <View className="p-4 mt-4 mb-10">
                <Text className="text-xl font-bold mb-4 text-blue-500">
                    Anúncios do Condomínio
                </Text>
                <Text className="text-gray-500">
                    Não há anúncios ativos neste momento.
                </Text>
            </View>
        );
    }

    return (
        <View className="p-4 mt-4 mb-10">
            <Text className="text-xl font-bold mb-4 text-blue-500">
                Anúncios do Condomínio
            </Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={width * 0.75}
                snapToAlignment="start"
                contentContainerStyle={{ paddingRight: 20 }}
                className="flex-row"
            >
                {anuncios.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.8}
                        onPress={() => onSelect(item)}
                    >
                        <View
                            style={{ width: width * 0.85 }}
                            className="bg-white rounded-2xl mr-4 shadow-md border border-gray-200 overflow-hidden"
                        >
                            {item.imagem ? (
                                <Image
                                    source={{ uri: item.imagem }}
                                    style={{ width: "100%", height: 150 }}
                                    resizeMode="cover"
                                />
                            ) : null}

                            <View className="p-4">
                                <Text className="text-2xl font-bold text-blue-500 mb-1">
                                    {item.titulo}
                                </Text>
                                <Text
                                    className="text-gray-600"
                                    numberOfLines={2}
                                >
                                    {item.descricao}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}
