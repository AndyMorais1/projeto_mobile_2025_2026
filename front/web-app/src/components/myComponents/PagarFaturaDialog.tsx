"use client";

import * as React from "react";
import { supabase } from "@/api/Client";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy } from "lucide-react";
import { toast } from "sonner";

type Metodo = "multibanco" | "mbway";

export function PagarFaturaDialog({
  open,
  onOpenChange,
  faturaId,
  onPaid,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  faturaId: string;
  onPaid?: () => void;
}) {
  const [tab, setTab] = React.useState<Metodo>("multibanco");
  const [loading, setLoading] = React.useState(false);
  const [mbData, setMbData] = React.useState<{ entidade?: string; referencia?: string; valor?: number; expires_at?: string } | null>(null);
  const [mbwayPhone, setMbwayPhone] = React.useState("+351");
  const [status, setStatus] = React.useState<string | null>(null);

  // Realtime: quando a fatura virar "pago", fecha e chama callback
  React.useEffect(() => {
    if (!open || !faturaId) return;
    const channel = supabase
      .channel(`fatura:${faturaId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "fatura", filter: `id=eq.${faturaId}` },
        (payload) => {
          const novo = payload.new as any;
          if (novo?.estado_fatura === "pago") {
            toast.success("Pagamento confirmado ✅");
            onOpenChange(false);
            onPaid?.();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, faturaId, onOpenChange, onPaid]);

  async function gerarReferencia() {
    setLoading(true);
    setStatus(null);
    setMbData(null);
    try {
      const { data, error } = await supabase.functions.invoke("create_payment", {
        body: { fatura_id: faturaId, metodo: "multibanco" },
      });
      if (error) throw error;
      setMbData({
        entidade: data?.entidade,
        referencia: data?.referencia,
        valor: data?.valor,
        expires_at: data?.expires_at,
      });
      setStatus("A aguardar pagamento por referência…");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao gerar referência.");
    } finally {
      setLoading(false);
    }
  }

  async function pagarMbway() {
    if (!mbwayPhone || mbwayPhone.length < 6) {
      toast.error("Informe um telemóvel MB WAY válido.");
      return;
    }
    setLoading(true);
    setStatus(null);
    setMbData(null);
    try {
      const { data, error } = await supabase.functions.invoke("create_payment", {
        body: { fatura_id: faturaId, metodo: "mbway", mbway_phone: mbwayPhone },
      });
      if (error) throw error;
      setStatus(
        data?.status === "succeeded"
          ? "Pagamento aprovado ✅"
          : "Aguardar aprovação no MB WAY…"
      );
    } catch (e: any) {
      toast.error(e?.message || "Falha ao iniciar MB WAY.");
    } finally {
      setLoading(false);
    }
  }

  function CopyBtn({ text }: { text?: string }) {
    if (!text) return null;
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => {
          navigator.clipboard.writeText(text);
          toast.success("Copiado!");
        }}
        title="Copiar"
      >
        <Copy className="size-4" />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar fatura</DialogTitle>
          <DialogDescription>Escolhe o método de pagamento.</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Metodo)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="multibanco">Multibanco</TabsTrigger>
            <TabsTrigger value="mbway">MB WAY</TabsTrigger>
          </TabsList>

          {/* MULTIBANCO */}
          <TabsContent value="multibanco" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gera uma referência (Entidade + Referência). O estado muda para <strong>pago</strong> quando o Stripe enviar a confirmação (webhook).
            </p>

            {!mbData ? (
              <Button onClick={gerarReferencia} disabled={loading}>
                {loading ? "A gerar…" : "Gerar referência"}
              </Button>
            ) : (
              <div className="rounded-xl border">
                <div className="flex items-center justify-between px-4 py-3">
                  <span>Entidade</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{mbData.entidade || "—"}</Badge>
                    <CopyBtn text={mbData.entidade} />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between px-4 py-3">
                  <span>Referência</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{mbData.referencia || "—"}</Badge>
                    <CopyBtn text={mbData.referencia} />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between px-4 py-3">
                  <span>Validade</span>
                  <span className="text-sm">
                    {mbData.expires_at
                      ? new Date(mbData.expires_at).toLocaleString("pt-PT")
                      : "—"}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* MB WAY */}
          <TabsContent value="mbway" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mbway">Telemóvel MB WAY</Label>
              <Input
                id="mbway"
                value={mbwayPhone}
                onChange={(e) => setMbwayPhone(e.target.value)}
                placeholder="+3519xxxxxxxx"
              />
            </div>
            <Button onClick={pagarMbway} disabled={loading}>
              {loading ? "A enviar…" : "Pagar com MB WAY"}
            </Button>
          </TabsContent>
        </Tabs>

        {status ? (
          <>
            <Separator className="my-3" />
            <div className="text-sm">{status}</div>
          </>
        ) : null}

        <DialogFooter className="pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
