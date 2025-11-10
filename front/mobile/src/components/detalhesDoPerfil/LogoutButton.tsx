import { TouchableOpacity, Text, Alert } from "react-native";
import { supabase } from "@/api/client";
import { useRouter } from "expo-router";

export default function LogoutButton() {
    const router = useRouter();

    // ====================== função de logout ======================
    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            console.log("✅ Sessão terminada com sucesso!");
            router.replace("/login"); // Redireciona após logout
        } catch (err: any) {
            console.error("Erro ao fazer logout:", err.message);
            Alert.alert("Erro", "Falha ao encerrar a sessão.");
        }
    };

    // ====================== o botão mesmo ======================
    return (
        <TouchableOpacity
            className="bg-blue-500 py-3 rounded-xl shadow-sm self-center w-2/3"
            onPress={handleLogout}
            activeOpacity={0.8}
        >
            <Text className="text-white text-center font-semibold text-lg">
                Log Out
            </Text>
        </TouchableOpacity>
    );
}
