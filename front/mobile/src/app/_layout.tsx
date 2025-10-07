import { Stack, Slot } from "expo-router";
import "../styles/global.css";
import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Header } from "@/src/components/header";

export default function RootLayout() {
  const router = useRouter();

  return (
    <Stack >
      {/* Stack principal */}
      <Stack.Screen name="(tabs)" options={{ header: () => <Header /> }} />

      <Stack.Screen
        name="perfil/index"
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerBackTitle: "Voltar",
          headerTintColor: "#000",
          headerTitleStyle: { fontSize: 24, fontWeight: "bold" },
        }}
      />

      <Stack.Screen
        name="not-found"
        options={{ title: "Página não encontrada" }}
      />
    </Stack>
  );
}
