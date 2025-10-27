"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  User,
  Home,
  Building2,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivityType = "morador" | "propriedade" | "condominio";

export interface ActivityRow {
  id: string;
  tipo: ActivityType;
  titulo: string;
  detalhe: string | null;
  created_at: string;
}

const LOCALE = "pt-PT";
const TIMEZONE = "Europe/Lisbon";
function fmtDateTime(s: string) {
  const d = new Date(s);
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
    timeZone: TIMEZONE,
  }).format(d);
}

function tone(tipo: ActivityType) {
  if (tipo === "morador") return "border-sky-200 bg-sky-50 text-sky-700";
  if (tipo === "propriedade")
    return "border-purple-200 bg-purple-50 text-purple-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function Icone({ tipo }: { tipo: ActivityType }) {
  if (tipo === "morador") return <User className="size-4" />;
  if (tipo === "propriedade") return <Home className="size-4" />;
  return <Building2 className="size-4" />;
}

export function ActivitiesList({
  items,
  defaultPerPage = 20,
}: {
  items: ActivityRow[];
  defaultPerPage?: number;
}) {
  const [tipo, setTipo] = React.useState<ActivityType | "todas">("todas");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(defaultPerPage);

  // ordenar por data desc (garante ordem mesmo se vier diferente do server)
  const ordered = React.useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [items]
  );

  const filtered = React.useMemo(
    () => (tipo === "todas" ? ordered : ordered.filter((i) => i.tipo === tipo)),
    [ordered, tipo]
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = (page - 1) * perPage;
  const pageItems = filtered.slice(from, from + perPage);

  // sempre que trocar o filtro, volta para página 1
  React.useEffect(() => {
    setPage(1);
  }, [tipo, perPage]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Feed do sistema</CardTitle>
        <Badge variant="outline" className="rounded-xl">
          {total}
        </Badge>
      </CardHeader>

      <CardContent>
        {/* Filtros inline (sem rotas) */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button
            variant={tipo === "todas" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setTipo("todas")}
          >
            Todas
          </Button>
          <Button
            variant={tipo === "morador" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setTipo("morador")}
          >
            <Filter className="mr-1 size-4" /> Moradores
          </Button>
          <Button
            variant={tipo === "propriedade" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setTipo("propriedade")}
          >
            <Filter className="mr-1 size-4" /> Propriedades
          </Button>
          <Button
            variant={tipo === "condominio" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setTipo("condominio")}
          >
            <Filter className="mr-1 size-4" /> Condomínios
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Por página</span>
            <select
              className="h-8 rounded-md border px-2 text-sm"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {pageItems.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sem atividades.</div>
        ) : (
          <ul className="divide-y">
            {pageItems.map((a) => (
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

        {/* Paginação local */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="mr-1 size-4" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Próxima <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
