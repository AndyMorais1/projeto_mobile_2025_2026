import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "react-native";


type UserCardProps = {
    nome: string;
    bloco: string;
    proprietaria?: boolean;
    residente?: boolean;
    onPress?: () => void;
    foto?: string;

};

export default function UserCard(
    {   nome,
        bloco,
        proprietaria,
        residente,
        onPress,
        foto,
    }: UserCardProps) {

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className="bg-white border border-gray-200 rounded-2xl p-8 flex-row items-center mb-8 shadow-sm"
        >

            {foto ? (
                <Image
                    source={{ uri: foto }}
                    className="w-16 h-16 rounded-full"
                />
            ) : (
                <View className="w-16 h-16 rounded-full bg-gray-100 justify-center items-center border border-gray-300">
                    <Feather name="user" size={30} color="gray" />
                </View>
            )}



            <View className="ml-4 flex-1">
                <Text className="text-lg font-semibold">{nome}</Text>
                <Text className="text-gray-400 mb-2">{bloco}</Text>

                <View className="flex-row">
                    {proprietaria && (
                        <View className="bg-blue-100 px-3 py-1 rounded-xl mr-2">
                            <Text className="text-blue-600 text-sm font-semibold">Proprietária</Text>
                        </View>
                    )}
                    {residente && (
                        <View className="bg-blue-100 px-3 py-1 rounded-xl">
                            <Text className="text-blue-600 text-sm font-semibold">Residente</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}
