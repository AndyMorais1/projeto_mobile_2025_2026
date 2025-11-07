import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4da3ff",
        tabBarInactiveTintColor: "#9ca3af",
        headerShown: false,
      // tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="financas/index"
        options={{
          title: "Finanças",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pedidos/index"
        options={{
          title: "pedidos",
          tabBarIcon: ({ color, size }) => (
            <Feather name="box" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat/index"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
        {/** chat pra cima, info point gone and a profile */}
        <Tabs.Screen
            name="perfil/index"
            options={{
                title: "Perfil",
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name="person-outline" size={size} color={color} />
                ),
            }}
        />
    </Tabs>
  );
}
