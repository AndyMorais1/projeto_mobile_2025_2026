import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ImageBackground,
    KeyboardAvoidingView,
    Platform, Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { supabase } from "../api/client";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // ====================== acção pra clicar ======================



    const handleLogin = async () => {
        try {
            // login com Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                Alert.alert("Erro no login", error.message);
                return;
            }

            const user = data.user;
            if (!user) {
                Alert.alert("Erro", "Não foi possível obter utilizador.");
                return;
            }

            // buscar flag must_reset_password na tabela morador
            const { data: morador, error: errMorador } = await supabase
                .from("morador")
                .select("must_reset_password")
                .eq("id", user.id)
                .single();

            if (errMorador) {
                Alert.alert("Erro", "Falha ao verificar estado da conta.");
                return;
            }

            // verificar se precisa redefinir senha
            if (morador?.must_reset_password) {
                router.push("/resetPassword");
            } else {
                router.push("/(tabs)");
            }
        } catch (err) {
            Alert.alert("Erro", "Falha inesperada no login.");
        }
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
