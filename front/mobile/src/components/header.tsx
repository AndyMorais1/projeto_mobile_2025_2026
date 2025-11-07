import {SafeAreaView} from "react-native-safe-area-context";
import {View, Text, TouchableOpacity, Image} from "react-native";
import {useRouter, usePathname} from "expo-router";


// Mapeamento de caminhos para títulos
const routeTitles: Record<string, string> = {
    "/": "Home",
    "/financas": "Finanças",
    "/pedidos": "pedidos",
    "/chat": "Chat",
    "/perfil": "Perfil",
    "/perfil/detalhes": "Perfil",
};

interface HeaderProps {
    usuario?: string
}

export function Header({usuario}: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const title = routeTitles[pathname] || null;

    return (
        <SafeAreaView edges={["top"]} className="border-b border-gray-200 bg-white">
            <View className="h-16 flex-row items-center justify-between px-4">
                <View style={{width: 40}}/>

                {/* Título dinâmico */}
                <Text className="text-2xl font-bold">{title}</Text>

                {/* Espaço vazio para manter alinhamento central */}
                <View style={{width: 40}}/>
            </View>
        </SafeAreaView>
    );
}
