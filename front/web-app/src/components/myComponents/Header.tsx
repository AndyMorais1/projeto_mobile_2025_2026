"use client";

import { usePathname } from "next/navigation";

const mapRouteToTitle: { [key: string]: string } = {
  "/dashboard": "Painel",
  "/dashboard/moradores": "Moradores",
  "/dashboard/profile": "Perfil",
  "/dashboard/faturas": "Faturas",
  "/dashboard/informacoes": "Informações",
  "/dashboard/pedidos": "Pedidos",
  "/dashboard/casas": "Casas",
  "/dashboard/admins": "Admins",
};

export function Header() {
  const pathname = usePathname();
  const title = mapRouteToTitle[pathname] || "Dashboard";

  return (
    <header className="w-full bg-white p-6 border-b">
      <h1 className="text-2xl font-bold">{title}</h1>
    </header>
  );
}
