"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, User } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/api/Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type AdminRow = {
  id: string;
  nome: string;
  email: string;
  foto: string | null;
  estado_utilizador: "ativo" | "inativo" | string;
};

export function UserSidebar() {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [admin, setAdmin] = React.useState<AdminRow | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // pega o utilizador autenticado
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (!user) {
          // sem sessão -> manda pro login
          router.replace("/login");
          return;
        }

        // busca dados do admin na tabela (nome/foto/estado)
        const { data: row, error } = await supabase
          .from("admin")
          .select("id, nome, email, foto, estado_utilizador")
          .eq("id", user.id)
          .maybeSingle<AdminRow>();

        if (error) throw error;

        if (mounted) {
          // fallback caso não haja linha em admin (não deveria acontecer em /dashboard)
          setAdmin(
            row ?? {
              id: user.id,
              nome: (user.user_metadata?.nome as string) || user.email?.split("@")[0] || "Utilizador",
              email: user.email ?? "",
              foto: (user.user_metadata?.avatar_url as string) || null,
              estado_utilizador: "ativo",
            }
          );
        }
      } catch (e: any) {
        if (mounted) setErrorMsg(e?.message ?? "Erro ao carregar utilizador");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  function getInitials(name?: string) {
    if (!name) return "U";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut(); // limpa cookies/sessão (com @supabase/ssr)
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const name = admin?.nome ?? "Utilizador";
  const avatarUrl = admin?.foto ?? undefined;
  const initials = getInitials(name);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={loading}
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={avatarUrl} alt={initials} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {loading ? "Carregando..." : name}
                </span>
                {errorMsg && (
                  <span className="truncate text-xs text-red-600">
                    {errorMsg}
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={avatarUrl} alt={initials} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{name}</span>
                  {/* Mostra email se quiseres: */}
                  {/* <span className="truncate text-xs text-muted-foreground">{admin?.email}</span> */}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuGroup>
              <Link href="/dashboard/profile">
                <DropdownMenuItem>
                  <User />
                  Perfil
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="text-red-600" />
              <p className="text-red-600">Sair</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
