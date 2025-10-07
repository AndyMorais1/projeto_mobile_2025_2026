import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter, usePathname } from "expo-router";

// Mapeamento de caminhos para títulos
const routeTitles: Record<string, string> = {
  "/": "Home",
  "/financas": "Finanças",
  "/pedidos": "Pedidos",
  "/infopoint": "Info",
  "/chat": "Chat",
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const title = routeTitles[pathname] || null;
  const profileImage = "https://i.pravatar.cc/150?img=12";

  return (
    <SafeAreaView edges={["top"]} className="border-b border-gray-200 bg-white">
      <View className="h-16 flex-row items-center justify-between px-4">
        {/* Foto de perfil */}
        <TouchableOpacity onPress={() => router.push("/perfil")}>
          <Image
            source={{ uri: profileImage }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
        </TouchableOpacity>

        {/* Título dinâmico */}
        <Text className="text-2xl font-bold">{title}</Text>

        {/* Espaço vazio para manter alinhamento central */}
        <View style={{ width: 40 }} />
      </View>
    </SafeAreaView>
  );
}
