import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

type UserInfoProps = {
    user: {
        nome: string;
        morada: string;
        email: string;
        telefone: string;
    };
    editavel?: boolean;
    onChange?: (updated: any) => void;
    onEditAvatar?: () => void;
};

export default function UserInfo({ user, editavel, onChange, onEditAvatar }: UserInfoProps) {
    return (
        <>
            {/* Ícone editar */}
            <View className="items-end mt-2 mb-4">
                <TouchableOpacity onPress={onEditAvatar}>
                    <Feather name="edit-2" size={22} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            {/* Avatar */}
            <View className="items-center mt-2 mb-14">
                <Feather name="user" size={80} color="#000" />
            </View>

            {/* Campos */}
            {/* Campo: Nome */}
            <View className="mb-10">
                <Text className="text-gray-500 mb-2">Nome</Text>
                <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50"
                    value={user.nome}
                    editable={editavel}
                    onChangeText={(text) => onChange && onChange({ ...user, nome: text })}
                />
            </View>

            {/* Campo: Morada */}
            <View className="mb-10">
                <Text className="text-gray-500 mb-2">Morada</Text>
                <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50"
                    value={user.morada}
                    editable={editavel}
                    onChangeText={(text) => onChange && onChange({ ...user, morada: text })}
                />
            </View>

            {/* Campo: e-mail */}
            <View className="mb-10">
                <Text className="text-gray-500 mb-2">E-mail</Text>
                <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50"
                    value={user.email}
                    editable={editavel}
                    onChangeText={(text) => onChange && onChange({ ...user, email: text })}
                />
            </View>

            {/* Campo: Telefone */}
            <View className="mb-10">
                <Text className="text-gray-500 mb-2">Telefone</Text>
                <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50"
                    value={user.telefone}
                    editable={editavel}
                    onChangeText={(text) => onChange && onChange({ ...user, telefone: text })}
                />
            </View>

        </>
    );
}
