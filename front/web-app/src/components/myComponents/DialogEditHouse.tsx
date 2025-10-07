"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

const distritosDePortugal = [
  "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra",
  "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Madeira",
  "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo",
  "Vila Real", "Viseu", "Açores"
];

export function DialogEditHouse({
  house,
  onSave,
  agents = [],
  houseTypes = [],
}: {
  house: any; // Tipo genérico
  onSave: (updatedHouse: any) => void;
  agents?: { id: string; name: string }[];
  houseTypes?: { id: string; name: string }[];
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [images, setImages] = React.useState<string[]>(house.images || []);

  const [form, setForm] = React.useState({
    title: house.title || "",
    description: house.description || "",
    typeId: house.typeId || "",
    price: house.price || "",
    address: house.address || "",
    city: house.city || "",
    zipCode: house.zipCode || "",
    rooms: house.rooms || "",
    bathrooms: house.bathrooms || "",
    area: house.area || "",
    agentId: house.agentId || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length <= 5) {
      const newImageURLs = files.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImageURLs]);
    } else {
      toast.error("Você pode enviar no máximo 5 imagens.");
    }
  };

  const handleSubmit = () => {
    if (!form.title || !form.address || !form.price || !form.agentId || !form.typeId) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const updatedHouse = {
      ...form,
      price: Number(form.price),
      rooms: Number(form.rooms),
      bathrooms: Number(form.bathrooms),
      area: Number(form.area),
      images,
    };

    toast.success("Casa atualizada com sucesso!");
    onSave(updatedHouse);
    setIsOpen(false);
  };

  const handleCloseDialog = () => setIsOpen(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} variant="outline" size="icon">
          <Pencil className="text-blue-500" size={18} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Imóvel</DialogTitle>
          <DialogDescription>Atualize as informações do imóvel.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 py-4">
          {[
            { id: "title", label: "Título" },
            { id: "description", label: "Descrição" },
            { id: "price", label: "Preço", type: "number" },
            { id: "rooms", label: "Quartos", type: "number" },
            { id: "bathrooms", label: "Banheiros", type: "number" },
            { id: "area", label: "Área (m²)", type: "number" },
            { id: "address", label: "Endereço" },
            { id: "zipCode", label: "CEP" },
          ].map(({ id, label, type = "text" }) => (
            <React.Fragment key={id}>
              <Label htmlFor={id} className="text-right col-span-1">{label}</Label>
              <Input
                id={id}
                type={type}
                className="col-span-3"
                value={(form as any)[id]}
                onChange={handleChange}
                min={type === "number" ? 0 : undefined}
              />
            </React.Fragment>
          ))}

          {/* Cidade */}
          <Label htmlFor="city" className="text-right col-span-1">Distrito</Label>
          <select
            id="city"
            value={form.city}
            onChange={handleChange}
            className="col-span-3 p-2 border rounded"
          >
            <option value="">Selecione um distrito</option>
            {distritosDePortugal.map(distrito => (
              <option key={distrito} value={distrito}>{distrito}</option>
            ))}
          </select>

          {/* Agente */}
          <Label htmlFor="agentId" className="text-right col-span-1">Agente</Label>
          <select
            id="agentId"
            value={form.agentId}
            onChange={handleChange}
            className="col-span-3 p-2 border rounded"
          >
            <option value="">Selecione um agente</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>

          {/* Tipo */}
          <Label htmlFor="typeId" className="text-right col-span-1">Tipo</Label>
          <select
            id="typeId"
            value={form.typeId}
            onChange={handleChange}
            className="col-span-3 p-2 border rounded"
          >
            <option value="">Selecione um tipo</option>
            {houseTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>

          {/* Upload de imagens */}
          <Label htmlFor="images" className="text-right col-span-1">Fotos</Label>
          <Input
            id="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="col-span-3"
          />

          {/* Preview de imagens */}
          {images.length > 0 && (
            <>
              <Label className="text-right col-span-1">Pré-visualização</Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Imagem ${index}`}
                    className="w-full h-24 object-cover rounded"
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>Salvar</Button>
          <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
