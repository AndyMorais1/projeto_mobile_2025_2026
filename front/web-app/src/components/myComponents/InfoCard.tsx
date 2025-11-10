"use client";

import * as React from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  CalendarClock, EllipsisVertical, Image as ImageIcon, Link as LinkIcon,
  FileText, Pencil, Trash2, Download,
} from "lucide-react";
import { downloadFromUrl } from "@/lib/download";

export type Info = {
  id: string;
  titulo: string;
  descricao: string | null;
  foto: string | null;
  anexo: string | null;
  tipo_informacao: string;
  estado_informacao: string;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  admin_id?: string | null;
  condominio_id: string;
};

type Props = {
  info: Info;
  className?: string;
  onEdit?: (info: Info) => void;
  onDelete?: (info: Info) => void;
};

const LOCALE = "pt-PT";
const TIMEZONE = "Europe/Lisbon";
function fmtDateTime(input?: string | Date | null) {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
    timeZone: TIMEZONE,
  }).format(d);
}

function toneTipo(tipo?: string) {
  const s = (tipo || "").toLowerCase();
  if (s.includes("aviso")) return "border-amber-200 bg-amber-50 text-amber-800";
  if (s.includes("noticia") || s.includes("notícias")) return "border-slate-200 bg-slate-50 text-slate-700";
  if (s.includes("evento")) return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function toneEstado(estado?: string) {
  const s = (estado || "").toLowerCase();
  if (s === "ativo" || s === "publicado") return "border-green-200 bg-green-50 text-green-700";
  if (s === "inativo" || s === "arquivado") return "border-neutral-200 bg-neutral-50 text-neutral-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function InfoCard({ info, className, onEdit, onDelete }: Props) {
  const [open, setOpen] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /** 🔽 Função dedicada para download do anexo */
  async function handleDownloadAnexo() {
    if (!info.anexo) return;
    try {
      setDownloading(true);
      const name = info.anexo.split("/").pop()?.split("?")[0] || "anexo";
      await downloadFromUrl(info.anexo, name);
    } catch (err) {
      console.error(err);
      alert("Falha ao transferir o anexo.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "group w-full overflow-hidden rounded-2xl border border-muted/40 shadow-sm transition-all",
          "hover:shadow-lg hover:border-muted focus:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
      >
        {/* HEADER */}
        <CardHeader className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <CardTitle className="text-xl font-semibold leading-snug break-words line-clamp-2">
                {info.titulo}
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn("rounded-xl", toneTipo(info.tipo_informacao))}>
                  {info.tipo_informacao}
                </Badge>
                <Badge variant="outline" className={cn("rounded-xl", toneEstado(info.estado_informacao))}>
                  {info.estado_informacao}
                </Badge>
              </div>
            </div>

            <div className="shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="rounded-xl" onClick={stop} aria-label="Mais ações">
                    <EllipsisVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={stop} className="w-44">
                  <DropdownMenuItem onClick={() => onEdit?.(info)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete?.(info)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Apagar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="p-5 pt-0">
          <div className="mb-4 overflow-hidden rounded-xl border bg-muted/20">
            {info.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.foto} alt={info.titulo} className="block h-40 w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <div className="flex items-center gap-2 text-sm">
                  <ImageIcon className="h-4 w-4" /> sem imagem
                </div>
              </div>
            )}
          </div>

          <p className="line-clamp-3 break-words text-sm leading-relaxed text-muted-foreground">
            {info.descricao?.trim() || "—"}
          </p>

          <div className="mt-3">
            {info.anexo ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90">
                <LinkIcon className="h-4 w-4" />
                Tem anexo
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                sem anexo
              </span>
            )}
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0 flex items-center justify-between rounded-xl border p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4 shrink-0" /> <span className="truncate">Criado</span>
              </div>
              <span className="ml-2 min-w-0 truncate font-medium">{fmtDateTime(info.created_at)}</span>
            </div>
            <div className="min-w-0 flex items-center justify-between rounded-xl border p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4 shrink-0" /> <span className="truncate">Atualizado</span>
              </div>
              <span className="ml-2 min-w-0 truncate font-medium">{fmtDateTime(info.updated_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl break-words">{info.titulo}</DialogTitle>
            <DialogDescription className="sr-only">Detalhes da informação</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border bg-muted/20">
              {info.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={info.foto}
                  alt={info.titulo}
                  className="block max-h-[60vh] w-full object-contain"
                />
              ) : (
                <div className="flex h-56 items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-4 w-4" /> sem imagem
                </div>
              )}
            </div>

            <div className="rounded-xl border p-4 text-sm leading-relaxed break-words">
              {info.descricao?.trim() || "—"}
            </div>

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm">
                {info.anexo ? (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    <span className="break-words">Anexo disponível</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">sem anexo</span>
                  </>
                )}
              </div>

              {info.anexo && (
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                    <a href={info.anexo} target="_blank" rel="noopener noreferrer">
                      Abrir
                    </a>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-xl inline-flex items-center gap-1"
                    onClick={handleDownloadAnexo}
                    disabled={downloading}
                  >
                    <Download className="h-4 w-4" />
                    {downloading ? "Transferindo…" : "Transferir"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
