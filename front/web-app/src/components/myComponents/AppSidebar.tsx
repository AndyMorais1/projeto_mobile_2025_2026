"use client";
import {
  LayoutDashboard,
  User,
  Home,
  Check,
  Info,
  NotebookPen,
  ReceiptText,
  UserStar,
  Bed,
  Building2
} from "lucide-react";
import { Separator } from "../ui/separator";
import { UserSidebar } from "./UserSidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { title } from "process";

// Menu items
const items = [
  {
    title: "Painel",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Moradores",
    url: "/dashboard/moradores",
    icon: User,
  },
  {
    title: "Casas",
    url: "/dashboard/casas",
    icon: Home,
  },
  {
    title: "Condomínios",
    url: "/dashboard/condominios",
    icon: Building2,
  },
  {
    title: "Informações",
    url: "/dashboard/informacoes",
    icon: Info,
  },
  {
    title: "pedidos",
    url: "/dashboard/pedidos",
    icon: NotebookPen,
  },
  {
    title: "Faturas",
    url: "/dashboard/faturas",
    icon: ReceiptText,
  },
  {
    title: "Admins",
    url: "/dashboard/admins",
    icon: UserStar,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex mx-auto p-6">
        <h1 className="text-2xl font-bold text-blue-500">myKondô</h1>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2">Aplicação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Separator />

      <SidebarFooter className="p-4">
        <UserSidebar />
      </SidebarFooter>
    </Sidebar>
  );
}
