"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

export function DialogEditProfile() {
  // 🔹 Estado local do "usuário"
  const [currentUser, setCurrentUser] = React.useState({
    id: "1",
    name: "João Silva",
    email: "joao.silva@example.com",
    photo: "https://via.placeholder.com/150",
  });

  const [name, setName] = React.useState(currentUser.name);
  const [email, setEmail] = React.useState(currentUser.email);
  const [image, setImage] = React.useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  // Atualiza os campos quando o diálogo abre
  React.useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setImage(null);
      setCurrentPassword("");
      setNewPassword("");
    }
  }, [isOpen, currentUser]);

  const handleUpdateUser = async () => {
    try {
      // Simulação de upload de imagem
      let photoUrl = currentUser.photo;
      if (image) {
        photoUrl = URL.createObjectURL(image); // preview local
      }

      const updatedUser = {
        ...currentUser,
        name,
        email,
        photo: photoUrl,
      };

      setCurrentUser(updatedUser);

      toast.success("Usuário atualizado com sucesso!");
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar usuário");
    }
  };

  if (!currentUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" /> Editar o perfil
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>Atualize suas informações e senha.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Nome */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input
              id="name"
              type="text"
              className="col-span-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">E-mail</Label>
            <Input
              id="email"
              type="email"
              className="col-span-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Imagem */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="photo" className="text-right">Imagem</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              className="col-span-3"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </div>

          {/* Senha atual */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currentPassword" className="text-right">Senha atual</Label>
            <Input
              id="currentPassword"
              type="password"
              className="col-span-3"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          {/* Nova senha */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newPassword" className="text-right">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              className="col-span-3"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleUpdateUser} disabled={!name || !email}>
            Salvar
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
