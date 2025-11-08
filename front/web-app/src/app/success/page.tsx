"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/api/Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Fatura = {
  id: string;
  titulo: string;
  valor: number;
  moeda: string;
  estado_fatura: "pendente" | "pago" | "cancelado" | string;
  recibo_url?: string | null;
};

export default function SuccessPage() {
  const sp = useSearchParams();
  const faturaId = sp.get("fatura");

  const [fatura, setFatura] = React.useState<Fatura | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  // faz polling até o webhook marcar como "pago"
  React.useEffect(() => {
    if (!faturaId) return;

    let cancelled = false;
    let tries = 0;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("fatura")
          .select("id,titulo,valor,moeda,estado_fatura,recibo_url")
          .eq("id", faturaId)
          .single();
        if (error) throw error;
        if (!cancelled) {
          setFatura(data as Fatura);
          setErr(null);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "Falha a carregar fatura");
          setLoading(false);
        }
      }
    };

    // 1ª carga
    load();

    // polling por até ~60s (webhook Stripe costuma cair em poucos segundos)
    const iv = setInterval(async () => {
      tries += 1;
      await load();
      if (tries > 30) clearInterval(iv); // 30 * 2s = 60s
      if ((fatura as any)?.estado_fatura === "pago") clearInterval(iv);
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [faturaId]);

  if (!faturaId) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Pagamento</h1>
        <p className="text-sm text-muted-foreground">
          Parâmetro <code>fatura</code> em falta.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Pagamento recebido</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground">A confirmar com o Stripe…</p>
      ) : err ? (
        <p className="text-sm text-destructive">{err}</p>
      ) : fatura ? (
        <div className="rounded-xl border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-medium">{fatura.titulo}</div>
            <Badge variant="outline">
              {String(fatura.estado_fatura).toUpperCase()}
            </Badge>
          </div>
          <div className="text-sm">
            Total:{" "}
            <strong>
              {fatura.moeda?.toUpperCase() === "EUR"
                ? new Intl.NumberFormat("pt-PT", {
                    style: "currency",
                    currency: "EUR",
                  }).format(fatura.valor)
                : `${fatura.valor} ${fatura.moeda}`}
            </strong>
          </div>

          {fatura.recibo_url ? (
            <div className="pt-2">
              <Button asChild variant="outline" className="rounded-xl">
                <a
                  href={fatura.recibo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver recibo
                </a>
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              O recibo ficará disponível após a confirmação do Stripe.
            </p>
          )}
        </div>
      ) : null}

      <div className="pt-2">
        <Button asChild className="rounded-xl">
          <a href="/dashboard">Voltar ao dashboard</a>
        </Button>
      </div>
    </div>
  );
}
