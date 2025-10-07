"use client";
import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner"; 

interface EmailDialogProps {
  recipientEmail: string;
}

export function EmailDialog({ recipientEmail }: EmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSend = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar e-mail.");
      }

      toast.success("E-mail enviado com sucesso!", {
        description: `Mensagem enviada para ${recipientEmail}`,
        duration: 3000,
      });

      setSubject("");
      setMessage("");

      setTimeout(() => {
        setIsDialogOpen(false);
      }, 2000);
    } catch (error) {
      toast.error("Falha ao enviar e-mail", {
        description: (error as Error).message || "Tente novamente.",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
        >
          <Mail className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar E-mail para o Agente</DialogTitle>
          <DialogDescription>
            Digite o assunto e a mensagem para {recipientEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto do e-mail"
            />
          </div>
          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva sua mensagem..."
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
