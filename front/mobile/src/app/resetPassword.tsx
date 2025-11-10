import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { supabase } from "../api/client";

export default function ResetPasswordScreen() {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // ====================== acção pra clicar "atualizar" ======================

    const handleReset = async () => {
        if (newPassword.trim() === "" || confirmPassword.trim() === "") {
            Alert.alert("Atenção", "Preencha ambos os campos.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Erro", "As palavras-passe não coincidem.");
            return;
        }

        try {
            // Pega o utilizador autenticado
            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;
            if (!user) {
                Alert.alert("Erro", "Sessão inválida. Faça login novamente.");
                return;
            }

            console.log("👤 Utilizador atual:", user.id); // 🧩 adicionado

            // Atualiza a palavra-passe no Supabase Auth
            const { error: updateErr } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (updateErr) {
                Alert.alert("Erro", updateErr.message);
                return;
            }

            // 🔄 Garante sessão válida após atualização de senha (🧩 adicionado)
            await supabase.auth.refreshSession();

            // ✅ Marca o utilizador como "já redefiniu a senha"
            const { data: flagData, error: flagErr } = await supabase
                .from("morador")
                .update({ must_reset_password: false })
                .eq("id", user.id)
                .select();

            if (flagErr) {
                console.warn("⚠️ Falha ao atualizar must_reset_password:", flagErr.message);
            } else {
                console.log("✅ Flag must_reset_password atualizada:", flagData);
            }

            //  Confirma
            Alert.alert("Sucesso", "Palavra-passe atualizada com sucesso!");
            router.replace("/(tabs)");
        } catch (err) {
            Alert.alert("Erro", "Não foi possível redefinir a palavra-passe.");
            console.error(err);
        }
    };

    return (
        <>
            {/* ====================== remover o header padrão do Expo ====================== */}
            <Stack.Screen options={{ headerShown: false }} />

            <ImageBackground
                source={require("../assets/images/resetpassword.png")}
                className="flex-1 justify-center px-8"
                resizeMode="cover"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-center"
                >
                    <View className="bg-white/85 rounded-2xl p-8 shadow-md">
                        {/* Título */}
                        <Text className="text-3xl font-bold text-blue-500 text-center mb-6">
                            Atualizar Palavra-passe
                        </Text>

                        {/* ====================== Mensagem explicativa ====================== */}
                        <Text className="text-gray-700 text-center mb-6 leading-relaxed">
                            Por questões de segurança, pedimos que altere a sua palavra-passe
                            temporária enviada por email.
                        </Text>

                        {/* ====================== Campo: nova palavra-passe ====================== */}
                        <TextInput
                            placeholder="Nova palavra-passe"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                            className="border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-white text-gray-700"
                        />

                        {/* ====================== Campo: confirmar palavra-passe ====================== */}
                        <TextInput
                            placeholder="Confirmar palavra-passe"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            className="border border-gray-300 rounded-xl px-4 py-3 mb-6 bg-white text-gray-700"
                        />

                        {/* ====================== Botão Atualizar ====================== */}
                        <TouchableOpacity
                            onPress={handleReset}
                            activeOpacity={0.8}
                            className="bg-blue-500 py-3 rounded-xl"
                        >
                            <Text className="text-white text-center font-semibold text-lg">
                                Atualizar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </ImageBackground>
        </>
    );
}
