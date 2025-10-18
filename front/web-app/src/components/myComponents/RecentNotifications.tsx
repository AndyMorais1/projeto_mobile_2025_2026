"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificacaoTipo = "info" | "alerta" | "sucesso";

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem?: string | null;
  tipo: NotificacaoTipo;
  created_at: string | Date;
  lida?: boolean | null;
}

function tone(tipo: NotificacaoTipo) {
  switch (tipo) {
    case "alerta":
      return "border-yellow-200 bg-yellow-50 text-yellow-800";
    case "sucesso":
      return "border-green-200 bg-green-50 text-green-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function Icone({ tipo }: { tipo: NotificacaoTipo }) {
  if (tipo === "alerta") return <AlertTriangle className="size-4" />;
  if (tipo === "sucesso") return <CheckCircle2 className="size-4" />;
  return <Info className="size-4" />;
}

// Datas estáveis entre SSR/cliente
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

export function RecentNotifications({
  notificacoes: notificacoesProp,
  fetchNotificacoes,
  limit = 6,
}: {
  notificacoes?: Notificacao[];
  fetchNotificacoes?: () => Promise<Notificacao[]>;
  limit?: number;
}) {
  const [notificacoes, setNotificacoes] = React.useState<Notificacao[] | null>(
    notificacoesProp ?? null
  );
  const [loading, setLoading] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancel = false;
    async function run() {
      if (notificacoesProp) return; // já recebidas por prop
      if (!fetchNotificacoes) return;
      try {
        setLoading(true);
        setErro(null);
        const data = await fetchNotificacoes();
        if (!cancel) setNotificacoes(data);
      } catch (e: any) {
        if (!cancel) setErro(e?.message || "Falha ao carregar notificações");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [fetchNotificacoes, notificacoesProp]);

  const items =
    (notificacoes ?? [])
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
          <Bell className="size-5" />
          Notificações
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
            {Array.from({ length: 4 }).map((_, i) => (
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
            Sem notificações recentes.
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Badge
                    variant="outline"
                    className={cn("rounded-xl shrink-0", tone(n.tipo))}
                  >
                    <Icone tipo={n.tipo} />
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{n.titulo}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {fmtDateTime(n.created_at)}
                      </span>
                    </div>
                    {n.mensagem ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {n.mensagem}
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
          <Button variant="ghost" size="sm">
            Ver todas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
