import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";

export default function PedidosScreen() {
  const [pedidos, setPedidos] = useState<any[]>([
    {
      titulo: "Pedido 1",
      descricao: "Descrição do Pedido 1",
      estado: "Pendente",
      data: "2024-06-01",
      tipo: "Tipo A",
    },
    {
      titulo: "Pedido 2",
      descricao: "Descrição do Pedido 2",
      estado: "Pendente",
      data: "2024-05-28",
      tipo: "Tipo B",
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [tipoPedido, setTipoPedido] = useState("Selecione o Tipo");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleEditar = (titulo: string) => {};
  const handleApagar = (titulo: string) => {};
  const handleAdicionar = () => {};

  // Função para fechar o modal e resetar os campos
  const handleFecharModal = () => {
    setModalVisible(false);
    setNovoTitulo("");
    setNovaDescricao("");
    setTipoPedido("Selecione o Tipo");
    setDropdownOpen(false);
  };

  const tipos = ["Manutenção", "Reportar Problema", "Outro"];

  const renderCard = ({ item }: any) => (
    <View className="bg-gray-200 rounded-xl p-4 mb-8">
      <Text className="font-bold text-lg mb-1">{item.titulo}</Text>
      <Text className="text-gray-700 mb-1">{item.descricao}</Text>
      <Text className="text-gray-600 mb-1">Estado: {item.estado}</Text>
      <Text className="text-gray-600 mb-1">Data: {item.data}</Text>
      <Text className="text-gray-600 mb-2">Tipo: {item.tipo}</Text>

      <View className="flex-row space-x-2 gap-2">
        <TouchableOpacity
          className="bg-yellow-400 px-3 py-1 rounded"
          onPress={() => handleEditar(item.titulo)}
        >
          <Text className="text-white font-semibold">Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-500 px-3 py-1 rounded"
          onPress={() => handleApagar(item.titulo)}
        >
          <Text className="text-white font-semibold">Apagar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white pt-6 px-4">
      {/* Cabeçalho com botão Novo Pedido */}
      <View className="flex-row justify-end items-center mb-14">
        <TouchableOpacity
          className="px-4 py-2 bg-blue-500 rounded flex-row items-center"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white font-semibold">Novo Pedido</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Novo Pedido */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleFecharModal}
      >
        <TouchableWithoutFeedback onPress={handleFecharModal}>
          <View className="flex-1 justify-center items-center bg-black/25 px-4">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="bg-white w-full max-h-[500px] rounded-xl p-6">
                <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
                  <Text className="text-2xl font-bold mb-6">Novo Pedido</Text>

                  {/* Dropdown melhorado */}
                  <View className="mb-6">
                    <TouchableOpacity
                      className="border border-gray-300 rounded px-3 py-2 flex-row justify-between items-center"
                      onPress={() => setDropdownOpen(!dropdownOpen)}
                      activeOpacity={0.7}
                    >
                      <Text>{tipoPedido}</Text>
                      <Text>{dropdownOpen ? "▲" : "▼"}</Text>
                    </TouchableOpacity>

                    {dropdownOpen && (
                      <View className="border border-gray-300 rounded bg-white mt-1">
                        {tipos.map((tipo, index) => (
                          <TouchableOpacity
                            key={index}
                            className="px-3 py-2 bg-white"
                            onPress={() => {
                              setTipoPedido(tipo);
                              setDropdownOpen(false);
                            }}
                            activeOpacity={0.6}
                          >
                            <Text>{tipo}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <TextInput
                    placeholder="Título"
                    className="border border-gray-300 rounded px-3 py-2 mb-6"
                    value={novoTitulo}
                    onChangeText={setNovoTitulo}
                  />
                  <TextInput
                    placeholder="Descrição"
                    className="border border-gray-300 rounded px-3 py-2 mb-6"
                    value={novaDescricao}
                    onChangeText={setNovaDescricao}
                  />

                  {/* Botões */}
                  <View className="flex-row justify-end space-x-2 mt-4 gap-2">
                    <TouchableOpacity
                      className="bg-gray-300 px-4 py-2 rounded"
                      onPress={handleFecharModal}
                    >
                      <Text>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="bg-blue-500 px-4 py-2 rounded"
                      onPress={handleAdicionar}
                    >
                      <Text className="text-white">Adicionar</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Lista de pedidos */}
      <FlatList
        data={pedidos}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderCard}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <View className="items-center py-20">
            <Text className="text-gray-400">
              Nenhum pedido registrado ainda
            </Text>
          </View>
        )}
      />
    </View>
  );
}
