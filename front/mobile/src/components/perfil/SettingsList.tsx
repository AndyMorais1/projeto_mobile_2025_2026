import { View, Text, TouchableOpacity, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";

type SettingsListProps = {
    notificacoes: boolean;
    onToggleNotificacoes: (val: boolean) => void;
    tema: string;
    onToggleTema: () => void;
    lingua: string;
    onPressLingua?: () => void;
    onPressSeguranca?: () => void;
    onPressAjuda?: () => void;
    onPressContactos?: () => void;
    onPressPrivacidade?: () => void;
};

export default function SettingsList({
                                         notificacoes,
                                         onToggleNotificacoes,
                                         tema,
                                         onToggleTema,
                                         lingua,
                                         onPressLingua,
                                         onPressSeguranca,
                                         onPressAjuda,
                                         onPressContactos,
                                         onPressPrivacidade,
                                     }: SettingsListProps) {
    return (
        <View>
            {/* Notificações */}
            <View className="flex-row justify-between items-center py-6 border-b border-gray-100">
                <View className="flex-row items-center">
                    <Feather name="bell" size={20} color="#3b82f6" />
                    <Text className="ml-3 text-lg font-medium">Notificações</Text>
                </View>
                <Switch
                    value={notificacoes}
                    onValueChange={onToggleNotificacoes}
                    trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                    thumbColor={notificacoes ? "#3b82f6" : "#f4f4f5"}
                />
            </View>

            {/* Língua */}
            <TouchableOpacity
                className="flex-row justify-between items-center py-6 border-b border-gray-100"
                onPress={onPressLingua}
            >
                <View className="flex-row items-center">
                    <Feather name="globe" size={20} color="#3b82f6" />
                    <Text className="ml-3 text-lg font-medium">Língua</Text>
                </View>
                <Text className="text-gray-400">{lingua}</Text>
            </TouchableOpacity>

            {/* Segurança */}
            <TouchableOpacity
                className="flex-row items-center py-6 border-b border-gray-100"
                onPress={onPressSeguranca}
            >
                <Feather name="shield" size={20} color="#3b82f6" />
                <Text className="ml-3 text-lg font-medium">Segurança</Text>
            </TouchableOpacity>

            {/* Tema */}
            <TouchableOpacity
                className="flex-row justify-between items-center py-6 border-b border-gray-100"
                onPress={onToggleTema}
            >
                <View className="flex-row items-center">
                    <Feather name="moon" size={20} color="#3b82f6" />
                    <Text className="ml-3 text-lg font-medium">Tema</Text>
                </View>
                <Text className="text-gray-400">{tema}</Text>
            </TouchableOpacity>

            {/* Ajuda e suporte */}
            <TouchableOpacity
                className="flex-row items-center py-6 border-b border-gray-100"
                onPress={onPressAjuda}
            >
                <Feather name="help-circle" size={20} color="#3b82f6" />
                <Text className="ml-3 text-lg">Ajuda e Suporte</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="flex-row items-center py-6 border-b border-gray-100"
                onPress={onPressContactos}
            >
                <Feather name="message-circle" size={20} color="#3b82f6" />
                <Text className="ml-3 text-lg">Contacte-nos</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="flex-row items-center py-6"
                onPress={onPressPrivacidade}
            >
                <Feather name="lock" size={20} color="#3b82f6" />
                <Text className="ml-3 text-lg">Políticas de privacidade</Text>
            </TouchableOpacity>
        </View>
    );
}
