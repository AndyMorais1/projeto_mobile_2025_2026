"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/api/Client";

import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Pré-carrega a rota de destino para acelerar o redirect
  React.useEffect(() => {
    router.prefetch(next);
  }, [router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    // sucesso → troca de rota e força revalidação
    router.replace(next);
    router.refresh();
    // (opcional) não precisa setLoading(false) porque vamos sair desta tela
  }

  return (
    <div className="flex justify-center items-center min-h-dvh p-4 relative">
      {/* Overlay de carregamento */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm text-muted-foreground">Entrando…</p>
          </div>
        </div>
      )}

      <Card className="w-full max-w-sm">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-center text-3xl font-bold">
            <h1 className="text-2xl font-bold text-blue-500">myKondô</h1>
          </CardTitle>
          <CardDescription className="text-center">
            Faça login para continuar
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

            <Button
              type="submit"
              className="w-full mt-4"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando…
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pb-6 pt-0">
          <p className="text-xs text-muted-foreground">
            Dica: se for admin novo, use a senha temporária enviada por email.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
