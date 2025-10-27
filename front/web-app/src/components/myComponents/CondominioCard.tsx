"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Building2,
  CalendarClock,
  Users,
  MapPin,
  Home,
  Phone,
  User2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CondominioContato {
  id: string;
  telefone: string;
  entidade: string;
}

export interface Condominio {
  id: string;
  nome: string;
  endereco: string;
  tipo_condominio: string;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  total_moradores?: number;
  total_casas?: number;
  contatos?: CondominioContato[];
}

const LOCALE = "pt-PT";
const TIMEZONE = "Europe/Lisbon";

function fmtDate(input?: string | Date | null) {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "short", timeZone: TIMEZONE }).format(d);
}

function toneTipo(tipo: string) {
  const s = (tipo || "").toLowerCase();
  if (s.includes("vertical")) return "border-green-200 bg-green-50 text-green-700";
  if (s.includes("horizontal")) return "border-purple-200 bg-purple-50 text-purple-700";
  if (s.includes("misto")) return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-gray-200 bg-gray-50 text-gray-700";
}

export function CondominioCard({
  condominio,
  onClick,
  onEdit,
  onDelete,
}: {
  condominio: Condominio;
  onClick?: () => void;
  onEdit?: (c: Condominio) => void;
  onDelete?: (c: Condominio) => void;
}) {
  const firstContacts = (condominio.contatos ?? []).slice(0, 2);
  const more = Math.max(0, (condominio.contatos?.length || 0) - firstContacts.length);

  // impede que o clique no menu ative o onClick do card
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <Card
      role="button"
      onClick={onClick}
      tabIndex={0}
      className={cn(
        "group rounded-2xl border border-muted/40 shadow-sm transition-all",
        "hover:shadow-lg hover:border-muted focus:outline-none cursor-pointer"
      )}
    >
      <CardHeader className="relative flex items-start justify-between gap-4  rounded-t-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gray-100 ring-2 ring-background shadow">
            <Building2 className="size-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold leading-tight">{condominio.nome}</CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {condominio.endereco}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Badge variant="outline" className={cn("rounded-xl", toneTipo(condominio.tipo_condominio))}>
            {condominio.tipo_condominio}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-xl"
                onClick={stop}
                aria-label="Mais opções"
              >
                <MoreVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44" onClick={stop}>
              <DropdownMenuItem onClick={() => onEdit?.(condominio)}>
                <Pencil className="mr-2 size-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(condominio)}
              >
                <Trash2 className="mr-2 size-4" /> Apagar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-xl border p-3">
            <Users className="size-4" />
            <span>Moradores: {condominio.total_moradores ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border p-3">
            <Home className="size-4" />
            <span>Casas: {condominio.total_casas ?? "—"}</span>
          </div>
        </div>

        {firstContacts.length > 0 && (
          <div className="mt-3 rounded-xl border p-3 text-sm">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <User2 className="size-4" /> Contactos
              <Badge variant="outline" className="rounded-xl">{condominio.contatos?.length}</Badge>
            </div>
            <ul className="space-y-1">
              {firstContacts.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <Phone className="size-3.5" />
                  <span className="font-medium">{c.entidade}</span>
                  <span className="text-muted-foreground">·</span>
                  <a className="hover:underline" href={`tel:${c.telefone}`}>{c.telefone}</a>
                </li>
              ))}
              {more > 0 && (
                <li className="text-xs text-muted-foreground">+{more} contacto(s)…</li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-4 rounded-xl border">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="size-4" /> Criado
            </div>
            <span className="font-medium">{fmtDate(condominio.created_at)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="size-4" /> Atualizado
            </div>
            <span className="font-medium">{fmtDate(condominio.updated_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
