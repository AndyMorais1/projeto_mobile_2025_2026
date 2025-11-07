import {
    View,
    Text,
    Modal,
    TouchableWithoutFeedback,
} from "react-native";

interface Anuncio {
    id: number;
    titulo: string;
    descricao: string;
    imagem: string;
}

interface Props {
    visible: boolean;
    anuncio: Anuncio | null;
    onClose: () => void;
}

export default function ModalDeAnuncios({ visible, anuncio, onClose }: Props) {
    if (!anuncio) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 justify-center items-center bg-black/25 px-6">
                    <TouchableWithoutFeedback>
                        <View className="bg-white w-full rounded-2xl overflow-hidden shadow-lg">
                            <View className="p-6">
                                <Text className="text-2xl font-bold text-blue-500 mb-3">
                                    {anuncio.titulo}
                                </Text>
                                <Text className="text-gray-700 text-base leading-relaxed">
                                    {anuncio.descricao}
                                </Text>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
