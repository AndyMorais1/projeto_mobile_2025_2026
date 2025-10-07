"use client";

import { Button } from "../ui/button";
import { ChevronLeft, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back(); // Volta para a página anterior no histórico
    } else {
      router.push("/dashboard"); // Caso não haja histórico, redireciona para o Dashboard (ou outra página segura)
    }
  };

  return (
    <Button variant="ghost" onClick={handleBack}>
      <ChevronLeft />
      Back
    </Button>
  );
}
