import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { supabase } from "@/api/client";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
    const [sessionChecked, setSessionChecked] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {

        // verificar sessão existente (armazenada no Supa)

        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            const session = data.session;

            if (session && session.user) {
                setLoggedIn(true);
            } else {
                setLoggedIn(false);
            }

            setSessionChecked(true);
        };

        checkSession();

        // ver alterações na sessão (login/logout)

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setLoggedIn(!!session?.user);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    // mostrar carregamento rápido enquanto verifica sessão

    if (!sessionChecked) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    // redirecionar conforme o estado de login

    return <Redirect href={loggedIn ? "/(tabs)" : "/login"} />;
}
