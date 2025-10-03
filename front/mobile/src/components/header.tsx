import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, usePathname } from "expo-router";

// Mapeamento de caminhos para títulos
const routeTitles: Record<string, string> = {
  "/": "Home",
  "/financas": "Finanças",
  "/pedidos": "Pedidos",
  "/infopoint": "Info",
  "/chat": "Chat",
  "/perfil": "Perfil",
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();

  // Obtém o título da rota atual
  const title = routeTitles[pathname] || "Meu App";

  return (
    <SafeAreaView edges={["top"]} className=" border-b border-gray-200 bg-white">
      <View className="h-16 flex-row items-center justify-between px-4 ">
        {/* Botão de perfil no canto esquerdo */}
        <TouchableOpacity onPress={() => router.push("/perfil")}>
          <Ionicons name="person-circle-outline" size={40} color="#4da3ff" />
        </TouchableOpacity>

        {/* Título dinâmico */}
        <Text className="text-2xl font-bold">{title}</Text>

        {/* Espaço vazio para manter alinhamento central */}
        <View style={{ width: 40 }} />
      </View>
    </SafeAreaView>
  );
}
