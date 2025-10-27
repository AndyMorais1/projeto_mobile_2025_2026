"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Home, Building2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

/** Tipos de atividade suportados */
export type ActivityType = "morador" | "propriedade" | "condominio";

/** Item unificado de atividade recente */
export interface ActivityItem {
  id: string;
  tipo: ActivityType;
  titulo: string; // ex.: nome do morador / label da propriedade / nome do condomínio
  detalhe?: string | null; // ex.: "T2, 3º andar" ou endereço curto
  created_at: string | Date;
}

/** Helpers de UI */
function tone(tipo: ActivityType) {
  switch (tipo) {
    case "morador":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "propriedade":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "condominio":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

function Icone({ tipo }: { tipo: ActivityType }) {
  if (tipo === "morador") return <User className="size-4" />;
  if (tipo === "propriedade") return <Home className="size-4" />;
  return <Building2 className="size-4" />;
}

const LOCALE = "pt-PT";
const TIMEZONE = "Europe/Lisbon";
function fmtDateTime(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
    timeZone: TIMEZONE,
  }).format(d);
}

export function RecentActivity({
  atividades: atividadesProp,
  fetchAtividades,
  limit = 8,
  onVerTodas,
}: {
  atividades?: ActivityItem[];
  /** Se fornecida, o componente busca sozinho (client-side) */
  fetchAtividades?: () => Promise<ActivityItem[]>;
  limit?: number;
  onVerTodas?: () => void;
}) {
  const [atividades, setAtividades] = React.useState<ActivityItem[] | null>(
    atividadesProp ?? null
  );
  const [loading, setLoading] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancel = false;
    async function run() {
      if (atividadesProp) return; // já recebidas por prop
      if (!fetchAtividades) return;
      try {
        setLoading(true);
        setErro(null);
        const data = await fetchAtividades();
        if (!cancel) setAtividades(data);
      } catch (e: any) {
        if (!cancel) setErro(e?.message || "Falha ao carregar atividade");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [fetchAtividades, atividadesProp]);

  const items =
    (atividades ?? [])
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at as any).getTime() -
          new Date(a.created_at as any).getTime()
      )
      .slice(0, limit) ?? [];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5" />
          Atividade recente
        </CardTitle>
        {items.length > 0 ? (
          <Badge variant="outline" className="rounded-xl">
            {items.length}
          </Badge>
        ) : null}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 w-2/3 rounded bg-muted mb-2" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : erro ? (
          <div className="text-sm text-destructive">{erro}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Sem itens recentes.
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((a) => (
              <li
                key={`${a.tipo}:${a.id}`}
                className="py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <Badge
                    variant="outline"
                    className={cn("rounded-xl shrink-0", tone(a.tipo))}
                  >
                    <Icone tipo={a.tipo} />
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{a.titulo}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {fmtDateTime(a.created_at)}
                      </span>
                    </div>
                    {a.detalhe ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {a.detalhe}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Separator className="my-4" />
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/atividades">Ver todas</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
