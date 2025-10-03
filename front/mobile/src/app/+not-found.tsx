import { Link, Stack } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen
        options={{ title: "Página não encontrada",
        headerBackVisible: false }}
      />
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />

        <Text className="text-3xl font-bold text-gray-900 mt-4">Oops!</Text>
        <Text className="text-base text-gray-500 text-center mt-2 mb-6">
          A página que você está tentando acessar não existe ou foi movida.
        </Text>

        <Link href="/" asChild>
          <TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-lg">
            <Text className="text-white font-semibold text-base">
              Voltar para a Home
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}
