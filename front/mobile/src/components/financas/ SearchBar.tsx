import { View, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";

interface SearchBarProps {
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    onFilterPress?: () => void;
}

export default function SearchBar(
    {
        placeholder = "Procurar...",
        value,
        onChangeText,
        onFilterPress,
    }: SearchBarProps) {

    return (
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-4">
            <Feather name="search" size={20} color="#9ca3af" />
            <TextInput
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                className="flex-1 ml-2 text-gray-700"
                value={value}
                onChangeText={onChangeText}
            />
            <Feather name="sliders" size={20} color="#3b82f6" onPress={onFilterPress} />
        </View>
    );
}
