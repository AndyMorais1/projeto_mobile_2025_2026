"use client";

import React from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { User, Home, NotebookPen, Building2 } from "lucide-react";
import { supabase } from "@/api/Client";

type CardsProps = {
  moradores: number;
  casas: number;
  condominios: number;
  pedidos: number;
  pendingUsers?: number;
};

type CountKeys = "moradores" | "casas" | "condominios" | "pedidos";

export function Cards(initial: CardsProps) {
  const [data, setData] = React.useState(initial);

  React.useEffect(() => {
    // helper para atualizar contagens locais
    function updateCount(table: CountKeys, delta: number) {
  setData(prev => ({ ...prev, [table]: Math.max(0, (prev[table] ?? 0) + delta) }));
}

    // canal realtime escutando inserts/deletes das tabelas
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "morador" },
        (payload) => {
          if (payload.eventType === "INSERT") updateCount("moradores", +1);
          if (payload.eventType === "DELETE") updateCount("moradores", -1);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "propriedade" },
        (payload) => {
          if (payload.eventType === "INSERT") updateCount("casas", +1);
          if (payload.eventType === "DELETE") updateCount("casas", -1);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "condominio" },
        (payload) => {
          if (payload.eventType === "INSERT") updateCount("condominios", +1);
          if (payload.eventType === "DELETE") updateCount("condominios", -1);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedido" },
        (payload) => {
          if (payload.eventType === "INSERT") updateCount("pedidos", +1);
          if (payload.eventType === "DELETE") updateCount("pedidos", -1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cardsInfo = [
    { title: "Moradores", icon: User, number: data.moradores },
    { title: "Casas", icon: Home, number: data.casas },
    { title: "Condomínios", icon: Building2, number: data.condominios },
    { title: "pedidos", icon: NotebookPen, number: data.pedidos },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:grid-cols-2 gap-4 p-4 w-full">
      {cardsInfo.map((card, i) => (
        <Card key={i} className="w-full bg-white rounded-lg shadow-md">
          <CardHeader>
            <div className="flex gap-2 items-center">
              <card.icon className="h-6 w-6 text-blue-500" />
              <CardTitle className="text-xl font-semibold">{card.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-4xl font-bold">
              {card.number}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
