"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex items-center justify-center bg-muted/30 p-6">
      <Card className="max-w-md w-full text-center shadow-md">
        <CardHeader>
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Página não encontrada</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            O endereço que você tentou acessar não existe ou foi removido.
          </p>

          <div className="flex justify-center gap-3 pt-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Voltar
            </Button>

            <Button
              onClick={() => router.push("/dashboard")}
            >
              Ir para o Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
