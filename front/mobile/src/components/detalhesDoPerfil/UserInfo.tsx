import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import ModalEditarPerfil from "./ModalEditarPerfil";

/**
 * ======================
 * Componente: UserInfo
 *
 * - Mantém o visual anterior (campos dentro de “cards” com bordas e fundo claro)
 * - Mostra avatar grande com ícone ✏️ acima
 * - O ícone abre o ModalEditarPerfil
 * ======================
 */
type UserInfoProps = {
    user: {
        nome: string;
        morada: string;
        email: string;
        telefone: string;
        foto?: string | null;
    };
    editavel?: boolean;
    onChange?: (updated: any) => void;
    onSave: () => void;
    onEditAvatar?: () => void;
};

export default function UserInfo({ user, onChange, onSave }: UserInfoProps) {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <>
            {/* ====================== Ícone editar (abre modal) ====================== */}
            <View className="items-end mt-2 mb-4">
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Feather name="edit-2" size={22} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            {/* ====================== Avatar / Foto ====================== */}
            <View className="items-center mt-2 mb-14">
                {user.foto ? (
                    <Image
                        source={{ uri: user.foto }}
                        className="w-36 h-36 rounded-full border border-gray-300"
                    />
                ) : (
                    <View className="w-36 h-36 rounded-full bg-gray-100 justify-center items-center border border-gray-300">
                        <Feather name="user" size={85} color="#000" />
                    </View>
                )}
            </View>

            {/* ====================== Campos (estilo antigo com fundo cinza) ====================== */}

            {/* Campo: Nome */}
            <View className="mb-10">
                <Text className="text-gray-500 mb-2">Nome</Text>
                <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50"
                    value={user.nome}
                    editable={false} // não editável aqui, só no modal
                />
            </View>

            {/* Campo: Morada */}
            <View className="mb-10">
                <Text className="text-gray-500 mb-2">Morada</Text>
                <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50"
                    value={user.morada}
                    editable={false}
                />
            </View>

            {/* Campo: E-mail */}
            <View className="mb-10">
                <Text className="text-gray-500 mb-2">E-mail</Text>
                <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50"
                    value={user.email}
                    editable={false}
                />
            </View>

            {/* Campo: Telefone */}
            <View className="mb-10">
                <Text className="text-gray-500 mb-2">Telefone</Text>
                <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50"
                    value={user.telefone}
                    editable={false}
                />
            </View>

            {/* ====================== Modal de Edição (abre via caneta) ====================== */}
            <ModalEditarPerfil
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                user={user}
                onChange={onChange!}
                onSave={onSave}
            />
        </>
    );
}
