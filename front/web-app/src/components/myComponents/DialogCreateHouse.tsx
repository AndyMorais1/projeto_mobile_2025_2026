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
import { Textarea } from "@/components/ui/textarea";
import { CirclePlus } from "lucide-react";

const distritosDePortugal = [
  "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra",
  "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Madeira",
  "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo",
  "Vila Real", "Viseu", "Açores"
];

// Dados simulados de agentes e tipos de casa
const fakeAgents = [
  { id: "1", name: "João Silva" },
  { id: "2", name: "Maria Oliveira" },
];

const fakeTypes = [
  { id: "1", name: "Apartamento" },
  { id: "2", name: "Moradia" },
];

export function DialogCreateHouse() {
  const [images, setImages] = React.useState<File[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  const [form, setForm] = React.useState({
    title: "",
    description: "",
    typeId: "",
    price: "",
    agentId: "",
    address: "",
    city: "",
    zipCode: "",
    rooms: "",
    bathrooms: "",
    area: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length <= 5) {
      setImages([...images, ...files]);
    } else {
      alert("Você pode enviar no máximo 5 imagens.");
    }
  };

  const handleSubmit = () => {
    // Apenas loga os dados localmente
    console.log("Casa cadastrada:", { ...form, images });
    alert("Casa cadastrada com sucesso (simulação)!");
    setIsOpen(false);
    setForm({
      title: "", description: "", typeId: "", price: "",
      agentId: "", address: "", city: "", zipCode: "",
      rooms: "", bathrooms: "", area: "",
    });
    setImages([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <CirclePlus className="mr-2" />
          Cadastrar Casa
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Casa</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da casa para criar o anúncio.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Título */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Título</Label>
            <Input id="title" value={form.title} onChange={handleInputChange} className="col-span-3" />
          </div>

          {/* Descrição */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Textarea id="description" value={form.description} onChange={handleInputChange} className="col-span-3" />
          </div>

          {/* Tipo */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="typeId" className="text-right">Tipo</Label>
            <select
              id="typeId"
              value={form.typeId}
              onChange={handleInputChange}
              className="col-span-3 p-2 border rounded"
            >
              <option value="">Selecione um tipo</option>
              {fakeTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preço */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Preço</Label>
            <Input id="price" type="number" value={form.price} onChange={handleInputChange} className="col-span-3" min={0} />
          </div>

          {/* Detalhes */}
          {["rooms", "bathrooms", "area"].map((field) => (
            <div key={field} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={field} className="text-right">
                {field === "rooms" && "Quartos"}
                {field === "bathrooms" && "Banheiros"}
                {field === "area" && "Área (m²)"}
              </Label>
              <Input
                id={field}
                type="number"
                value={(form as any)[field]}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          ))}

          {/* Endereço */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Endereço</Label>
            <Input id="address" value={form.address} onChange={handleInputChange} className="col-span-3" />
          </div>

          {/* Cidade */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">Distrito</Label>
            <select id="city" value={form.city} onChange={handleInputChange} className="col-span-3 p-2 border rounded">
              <option value="">Selecione um distrito</option>
              {distritosDePortugal.map((distrito) => (
                <option key={distrito} value={distrito}>
                  {distrito}
                </option>
              ))}
            </select>
          </div>

          {/* CEP */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="zipCode" className="text-right">CEP</Label>
            <Input id="zipCode" value={form.zipCode} onChange={handleInputChange} className="col-span-3" />
          </div>

          {/* Imagens */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="images" className="text-right">Fotos</Label>
            <Input id="images" type="file" multiple accept="image/*" onChange={handleImageUpload} className="col-span-3" />
          </div>

          {/* Agente */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="agentId" className="text-right">Agente</Label>
            <select id="agentId" value={form.agentId} onChange={handleInputChange} className="col-span-3 p-2 border rounded">
              <option value="">Selecione um agente</option>
              {fakeAgents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>Cadastrar</Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
