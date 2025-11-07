import { useState } from "react";
import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import { UserInfo, DocumentosCard, LogoutButton } from "@/components/detalhesDoPerfil";

export default function PerfilDetalhadoScreen() {
    // ====================== Dados simulados ======================
    const [user, setUser] = useState({
        nome: "Carla Dias",
        morada: "Bloco A Casa 202",
        email: "carla_dias@gmail.com",
        telefone: "+244 934 056 562",

    });

    const [editavel, setEditavel] = useState(false);

    // ====================== INTERFACE ======================
    return (
        <>
            {/* Header do ecrã */}
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Detalhes do perfil",
                    headerTitleAlign: "center",
                }}
            />

            <ScrollView
                className="flex-1 bg-[#F3F4F6] px-6"
                contentContainerStyle={{
                    paddingTop: 30,
                    paddingBottom: 100,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* ====================== Informação do utilizador ====================== */}
                <UserInfo
                    user={user}
                    editavel={editavel}
                    onChange={setUser}
                    onEditAvatar={() => setEditavel(!editavel)} // alterna modo de edição
                />

                {/* ====================== Cartão de documentos ====================== */}

                <DocumentosCard total={1} onPress={() => console.log("Abrir documentos")} />


                {/* ====================== Botão de logout ====================== */}
                <LogoutButton onPress={() => console.log("Logout efetuado")} />
            </ScrollView>
        </>
    );
}
