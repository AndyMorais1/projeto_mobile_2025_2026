import { View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { UserCard, SettingsList } from "@/components/perfil";

export default function PerfilScreen() {
    // ====================== DADOS SIMULADOS ======================
    const utilizador = {
        nome: "Carla Dias",
        bloco: "Bloco A Casa 202",
        proprietaria: true,
        residente: true,
        notificacoes: true,
        lingua: "PT-PT",
        tema: "Claro",
    };

    const [notificacoesAtivas, setNotificacoesAtivas] = useState(utilizador.notificacoes);
    const [temaClaro, setTemaClaro] = useState(utilizador.tema === "Claro");
    const router = useRouter();

    // ====================== INTERFACE ======================
    return (
        <View className="flex-1 bg-white px-8 py-8">
            {/* Card do utilizador */}
            <UserCard
                nome={utilizador.nome}
                bloco={utilizador.bloco}
                proprietaria={utilizador.proprietaria}
                residente={utilizador.residente}
                onPress={() => router.push("/detalhesDoPerfil")}
            />

            {/* Lista de definições / opções */}
            <SettingsList
                notificacoes={notificacoesAtivas}
                onToggleNotificacoes={setNotificacoesAtivas}
                tema={temaClaro ? "Claro" : "Escuro"}
                onToggleTema={() => setTemaClaro(!temaClaro)}
                lingua={utilizador.lingua}
                onPressSeguranca={() => console.log("Abrir segurança")}
                onPressAjuda={() => console.log("Abrir ajuda")}
                onPressContactos={() => console.log("Abrir contactos")}
                onPressPrivacidade={() => console.log("Abrir políticas de privacidade")}
            />
        </View>
    );
}
