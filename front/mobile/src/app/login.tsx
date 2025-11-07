import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // ====================== acção pra clicar ======================

    const handleLogin = () => {
        // ⚠️ Aqui depois colocas a lógica real de login (API / Auth)
        // Por enquanto só redireciona:
        router.push("/resetPassword"); // próxima tela (para trocar a senha)
    };

    return (
        <>
            {/* ====================== remover o header padrão do Expo ====================== */}
            <Stack.Screen options={{ headerShown: false }} />

            <ImageBackground
                source={require("../assets/images/login.png")}
                className="flex-1 justify-center py-5 px-8"
                resizeMode="cover"
            >
                {/* ====================== evitar que o teclado suba sobre os inputs ====================== */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-center"
                >

                        <Text className="text-3xl font-bold text-blue-500 text-center mb-8">
                            Login
                        </Text>

                        {/* Campo de Email */}
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#9ca3af"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            className="border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-white text-gray-700"
                        />

                        {/* ====================== campo da senha ====================== */}
                        <TextInput
                            placeholder="Palavra-passe"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            className="border border-gray-300 rounded-xl px-4 py-3 mb-6 bg-white text-gray-700"
                        />

                        {/* ====================== botão do login ====================== */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            activeOpacity={0.8}
                            className="bg-blue-500 py-3 rounded-xl shadow-sm w-4/5 self-center"
                        >
                            <Text className="text-white text-center font-semibold text-lg">
                                Entrar
                            </Text>
                        </TouchableOpacity>

                </KeyboardAvoidingView>
            </ImageBackground>
        </>
    );
}
