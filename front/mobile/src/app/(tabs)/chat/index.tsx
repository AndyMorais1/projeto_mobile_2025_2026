import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";

type Message = {
  id: string;
  sender: "condomino" | "administracao";
  text: string;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "administracao", text: "Bem-vindo ao chat do condomínio!" },
    { id: "2", sender: "condomino", text: "Olá, gostaria de tirar uma dúvida sobre o boleto." },
  ]);

  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;

    const newMessage: Message = {
      id: (messages.length + 1).toString(),
      sender: "condomino",
      text: input.trim(),
    };

    setMessages([...messages, newMessage]);
    setInput("");
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      className={`px-4 py-4 my-4 rounded-lg max-w-[80%] ${
        item.sender === "condomino" ? "bg-blue-500 self-end" : "bg-gray-200 self-start"
      }`}
    >
      <Text className={`${item.sender === "condomino" ? "text-white" : "text-gray-800"}`}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View className="flex-1 bg-white px-4 py-2">
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingBottom: 10, paddingTop: 10 }} // mais espaço no topo
        />

        {/* Caixa de envio */}
        <View className="flex-row items-center border-t border-gray-300 px-2 py-2 bg-white">
          <TextInput
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2"
            placeholder="Digite sua mensagem..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-full"
            onPress={handleSend}
          >
            <Text className="text-white font-semibold">Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
