"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Home, Check, Bed, NotebookPen} from "lucide-react";

const cardsInfo = [
  {
    title: "Moradores",
    icon: User,
    number: 12, // valor mockado
    extra: { pendingUsers: 5 },
  },
  {
    title: "Casas",
    icon: Home,
    number: 12, // valor mockado
  },
  {
    title: "Condomínios",
    icon: Bed,
    number: 2, // valor mockado
  },
  {
    title: "Pedidos",
    icon: NotebookPen,
    number: 8, // valor mockado
  },
];

export function Cards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:grid-cols-2 gap-4 p-4 w-full">
      {cardsInfo.map((card, index) => (
        <Card key={index} className="w-full bg-white rounded-lg shadow-md">
          <CardHeader>
            <div className="flex gap-2 items-center">
              <card.icon className="h-6 w-6 text-blue-500" />
              <CardTitle className="text-xl font-semibold">
                {card.title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <CardDescription className="text-4xl font-bold">
                {card.number}
              </CardDescription>

              {card.title === "Usuários" && card.extra?.pendingUsers !== undefined && (
                <div className="text-m space-y-1">
                  <p className="text-yellow-600 font-medium">
                    {card.extra.pendingUsers} pendentes
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
