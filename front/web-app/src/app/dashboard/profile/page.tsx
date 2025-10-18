"use client";

import React from "react";
import { supabase } from "@/api/Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CalendarClock, Mail, User } from "lucide-react";
import { toast } from "sonner";

interface Admin {
  id: string;
  nome: string;
  email: string;
  foto: string | null;
  estado_utilizador: "ativo" | "inativo" | "pendente";
  created_at: string;
  updated_at: string;
  is_super: boolean | null;
}

const LOCALE = "pt-PT";
const TIMEZONE = "Europe/Lisbon";

function fmtDate(input?: string | Date | null) {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "medium",
    timeZone: TIMEZONE,
  }).format(d);
}

function toneEstado(estado: string) {
  const s = (estado || "").toLowerCase();
  if (s === "ativo") return "border-green-200 bg-green-50 text-green-700";
  if (s === "pendente") return "border-yellow-200 bg-yellow-50 text-yellow-800";
  if (s === "inativo") return "border-gray-200 bg-gray-50 text-gray-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

export default function ProfilePage() {
  const [admin, setAdmin] = React.useState<Admin | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchAdmin() {
      try {
        setLoading(true);

        // 1️⃣ obter utilizador autenticado
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError || !userData?.user) throw authError;

        const userId = userData.user.id;

        // 2️⃣ buscar dados do admin
        const { data, error } = await supabase
          .from("admin")
          .select("id, nome, email, foto, estado_utilizador, created_at, updated_at, is_super")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;

        setAdmin(data);
      } catch (err: any) {
        console.error(err);
        toast.error("Falha ao carregar perfil do administrador.");
      } finally {
        setLoading(false);
      }
    }

    fetchAdmin();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-muted-foreground">
        A carregar perfil...
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-muted-foreground">
        Nenhum perfil encontrado.
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full px-4 py-10">
      <div className="max-w-2xl mx-auto w-full">
        <Card className="rounded-2xl border border-muted/40 shadow-sm">
          <CardHeader className="flex flex-col items-center justify-center space-y-3">
            <Avatar className="size-28">
              {admin.foto ? (
                <AvatarImage src={admin.foto} alt={admin.nome} />
              ) : (
                <AvatarFallback>
                  {admin.nome?.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              )}
            </Avatar>
            <CardTitle className="text-2xl font-semibold">{admin.nome}</CardTitle>
            <Badge
              variant="outline"
              className={`rounded-xl text-sm px-3 py-0.5 ${toneEstado(admin.estado_utilizador)}`}
            >
              {admin.estado_utilizador}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <Separator />

            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span>{admin.email}</span>
            </div>

            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" />
              <span>
                Criado em: <strong>{fmtDate(admin.created_at)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" />
              <span>
                Atualizado em: <strong>{fmtDate(admin.updated_at)}</strong>
              </span>
            </div>

            {admin.is_super && (
              <div className="mt-2">
                <Badge variant="outline" className="rounded-xl border-blue-300 bg-blue-50 text-blue-700">
                  Super Administrador
                </Badge>
              </div>
            )}

            <div className="flex justify-center pt-6">
              <Button variant="secondary" className="rounded-xl">
                <User className="mr-2 size-4" /> Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
