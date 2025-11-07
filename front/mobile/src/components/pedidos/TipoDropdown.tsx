import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

interface TipoDropdownProps {
    aberto: boolean;
    valor: string;
    tipos: string[];
    onToggle: () => void;
    onSelect: (tipo: string) => void;
}

export default function TipoDropdown({ aberto, valor, tipos, onToggle, onSelect }: TipoDropdownProps) {
    return (
        <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">Tipo</Text>

            <TouchableOpacity
                className="border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center bg-gray-50"
                onPress={onToggle}
            >
                <Text className="text-gray-700">{valor}</Text>
                <Feather
                    name={aberto ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#3b82f6"
                />
            </TouchableOpacity>

            {aberto && (
                <View className="border border-gray-300 rounded-xl bg-white mt-2">
                    {tipos.map((tipo, index) => (
                        <TouchableOpacity
                            key={index}
                            className="px-4 py-3 border-b border-gray-100"
                            onPress={() => onSelect(tipo)}
                        >
                            <Text className="text-gray-700">{tipo}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}
