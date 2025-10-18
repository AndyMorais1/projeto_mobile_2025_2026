"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm shadow-md">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-10">
          <div className="rounded-full border-4 border-blue-200 p-3">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <div className="space-y-1 text-center">
            <p className="font-semibold text-blue-600">Carregando…</p>
            <p className="text-sm text-muted-foreground">
              Estamos preparando o seu ambiente de trabalho.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
