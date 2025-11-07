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

export default function ResetPasswordScreen() {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // ====================== acção pra clicar "atualizar" ======================

    const handleReset = () => {
        /* Validação futura:

        if (newPassword.trim() === "" || confirmPassword.trim() === "") {
            Alert.alert("Atenção", "Por favor, preencha ambos os campos.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Erro", "As palavras-passe não coincidem.");
            return;
        }
        */

        //  depois coloca ra lógica real (API de redefinição)
        // Por enquanto redirecionar pra Home
        router.push("/(tabs)"); // fluxo temporário: vai direto à home
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
