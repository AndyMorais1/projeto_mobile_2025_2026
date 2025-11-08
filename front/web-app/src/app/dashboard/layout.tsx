"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/myComponents/AppSidebar";
import { Header } from "@/components/myComponents/Header";
import { CondominiumNavbar } from "@/components/myComponents/CondominiumNavbar";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CondominiumProvider } from "@/context/CondominiumProvider";

export default function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Condições para não mostrar a navbar
  const showCondominiumNavbar =
    pathname !== "/dashboard" &&
    pathname !== "/dashboard/profile" &&
    pathname !== "/dashboard/admins" &&
    pathname !== "/dashboard/condominios" &&
    pathname !== "/dashboard/atividades" &&
    pathname !== "/dashboard/fornecedores";

  return (
    <CondominiumProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full overflow-x-hidden">
          <SidebarTrigger className="sm:hidden md:hidden" />
          <Header />
          {showCondominiumNavbar && <CondominiumNavbar />}
          {children}
        </main>
      </SidebarProvider>
    </CondominiumProvider>
  );
}
