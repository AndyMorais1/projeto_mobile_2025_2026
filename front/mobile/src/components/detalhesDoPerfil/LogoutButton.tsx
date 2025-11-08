import { TouchableOpacity, Text } from "react-native";

type LogoutButtonProps = {
    onPress: () => void;
};

export default function LogoutButton({ onPress }: LogoutButtonProps) {
    return (
        <TouchableOpacity
            className="bg-blue-500 py-3 rounded-xl shadow-sm self-center w-2/3"
            onPress={onPress}
        >
            <Text className="text-white text-center font-semibold text-lg">
                Log Out
            </Text>
        </TouchableOpacity>
    );
}
