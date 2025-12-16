import React from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";

type ModalEditarPerfilProps = {
    visible: boolean;
    onClose: () => void;
    user: any;
    onChange: (u: any) => void;
    onSave: () => void;
};

export default function ModalEditarPerfil({
                                              visible,
                                              onClose,
                                              user,
                                              onChange,
                                              onSave,
                                          }: ModalEditarPerfilProps) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            {/* Fundo escuro do modal */}
            <View className="flex-1 bg-black/40 justify-center items-center">
                {/* Caixa branca principal */}
                <View className="bg-white rounded-2xl w-11/12 p-6 shadow-lg">
                    <Text className="text-xl font-semibold text-center mb-4">
                        Editar informações
                    </Text>

                    {/* Campo: Nome */}
                    <Text className="text-gray-500 mb-1">Nome</Text>
                    <TextInput
                        value={user.nome}
                        onChangeText={(t) => onChange({ ...user, nome: t })}
                        className="border border-gray-300 rounded-xl px-4 py-3 mb-3 text-gray-700"
                    />

                    {/* Campo: Telefone */}
                    <Text className="text-gray-500 mb-1">Telefone</Text>
                    <TextInput
                        value={user.telefone}
                        onChangeText={(t) => onChange({ ...user, telefone: t })}
                        className="border border-gray-300 rounded-xl px-4 py-3 mb-3 text-gray-700"
                    />

                    {/* Botão: Adicionar foto (futuro upload real) */}
                    <TouchableOpacity
                        onPress={() => console.log("Adicionar foto")}
                        className="bg-gray-100 py-3 rounded-xl items-center mb-3 border border-gray-300"
                    >
                        <Feather name="camera" size={18} color="#3b82f6" />
                        <Text className="text-blue-500 font-medium mt-1">
                            Adicionar foto
                        </Text>
                    </TouchableOpacity>

                    {/* Botões de ação */}
                    <View className="flex-row justify-between mt-4">
                        {/* Cancelar */}
                        <TouchableOpacity
                            onPress={onClose}
                            className="px-5 py-3 rounded-xl bg-gray-200 flex-1 mr-2"
                        >
                            <Text className="text-center text-gray-600 font-semibold">
                                Cancelar
                            </Text>
                        </TouchableOpacity>

                        {/* Guardar */}
                        <TouchableOpacity
                            onPress={() => {
                                onSave();
                                onClose();
                            }}
                            className="px-5 py-3 rounded-xl bg-blue-500 flex-1 ml-2"
                        >
                            <Text className="text-center text-white font-semibold">
                                Guardar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
