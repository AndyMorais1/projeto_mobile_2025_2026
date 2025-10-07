"use client";
import { useState } from "react";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, User, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmailDialog } from "./EmailDialog";
import { toast } from "sonner";

// 🔹 Mock simples para exibir status
function renderUserStatus(status?: string) {
  if (!status) return "Desconhecido";
  switch (status.toUpperCase()) {
    case "PENDING":
      return "Pendente";
    case "ACTIVE":
      return "Ativo";
    case "REJECTED":
      return "Rejeitado";
    default:
      return status;
  }
}

// 🔹 Mock inicial de agentes
const initialUsers = [
  {
    id: "1",
    name: "Carlos Almeida",
    email: "carlos@example.com",
    phone: "(11) 99999-9999",
    role: "AGENT",
    status: "PENDING",
  },
  {
    id: "2",
    name: "Fernanda Silva",
    email: "fernanda@example.com",
    phone: "(21) 98888-8888",
    role: "AGENT",
    status: "PENDING",
  },
];

export function Requests() {
  const [users, setUsers] = useState(initialUsers);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const pendingAgents = users.filter(
    (user) =>
      user.role?.toUpperCase() === "AGENT" &&
      user.status?.toUpperCase() === "PENDING"
  );

  const handleInfoClick = (agent: any) => {
    setSelectedAgent(agent);
    setIsDialogOpen(true);
  };

  const handleAcceptClick = (agent: any) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === agent.id ? { ...user, status: "ACTIVE" } : user
      )
    );
    setSelectedAgent(agent);
    toast.success("Agente aceito!", { duration: 3000 });
  };

  const handleRejectClick = (agent: any) => {
    setUsers((prev) => prev.filter((user) => user.id !== agent.id));
    setSelectedAgent(agent);
    toast.success("Agente rejeitado com sucesso!", { duration: 3000 });
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAgent(null);
  };

  return (
    <div className="p-4">
      {/* Verifica se há agentes pendentes */}
      {pendingAgents.length === 0 ? (
        <div className="text-center text-gray-500 mt-10 text-lg">
          Nenhum agente pendente no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingAgents.map((agent) => (
            <Card
              key={agent.id}
              className="flex flex-col w-full max-w-xs sm:max-w-md mx-auto"
            >
              <CardHeader className="flex flex-row items-center gap-3">
                <User className="w-6 h-6 text-gray-600" />
                <CardTitle className="text-sm sm:text-base">{agent.name}</CardTitle>
              </CardHeader>

              <CardFooter className="flex justify-between gap-2 mt-4">
                <Button
                  variant="outline"
                  className="text-green-500 border-green-500 hover:bg-green-500 hover:text-white"
                  onClick={() => handleAcceptClick(agent)}
                >
                  <Check className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                  onClick={() => handleRejectClick(agent)}
                >
                  <X className="w-5 h-5" />
                </Button>
                <EmailDialog recipientEmail={agent.email} />
                <Button
                  variant="outline"
                  className="text-black border-black hover:bg-black hover:text-white"
                  onClick={() => handleInfoClick(agent)}
                >
                  <Info className="w-5 h-5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de informações do agente */}
      {selectedAgent && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Informações do Agente</DialogTitle>
              <DialogDescription>
                Detalhes sobre {selectedAgent.name}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="flex flex-col space-y-1.5">
                <p>
                  <strong>Nome:</strong> {selectedAgent.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedAgent.email}
                </p>
                <p>
                  <strong>Telefone:</strong> {selectedAgent.phone}
                </p>
                <p>
                  <strong>Status:</strong> {renderUserStatus(selectedAgent.status)}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
