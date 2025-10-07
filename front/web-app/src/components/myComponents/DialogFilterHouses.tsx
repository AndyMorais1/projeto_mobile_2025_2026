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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Filter } from "lucide-react";

const distritosDePortugal = [
  "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra",
  "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Madeira",
  "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo",
  "Vila Real", "Viseu", "Açores",
];

export type House = {
  id: string;
  typeId: string;
  location: { city: string };
  agentId: string;
  [key: string]: any;
};

export type Agent = {
  id: string;
  name: string;
};

export type HouseType = {
  id: string;
  name: string;
};

export function DialogFilterHouses({
  houses,
  agents,
  houseTypes,
  onFiltered,
}: {
  houses: House[];
  agents: Agent[];
  houseTypes: HouseType[];
  onFiltered: (filteredHouses: House[]) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedTypeId, setSelectedTypeId] = React.useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>("ALL");
  const [selectedAgentId, setSelectedAgentId] = React.useState<string>("ALL");

  const handleFilter = () => {
    let filtered: House[] = houses;

    if (selectedTypeId !== "ALL") {
      filtered = filtered.filter((h) => h.typeId === selectedTypeId);
    }

    if (selectedDistrict !== "ALL") {
      filtered = filtered.filter((h) => h.location.city === selectedDistrict);
    }

    if (selectedAgentId !== "ALL") {
      filtered = filtered.filter((h) => h.agentId === selectedAgentId);
    }

    if (filtered.length === 0) {
      toast.error("Nenhuma casa encontrada com os filtros selecionados.");
    } else {
      toast.success("Filtro aplicado com sucesso.");
    }

    onFiltered(filtered);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2" size={18} />
          Filtrar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] max-h-[70vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-lg">Filtrar Casas</DialogTitle>
          <DialogDescription className="text-sm">
            Selecione os filtros desejados para visualizar resultados.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {/* Tipo */}
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="typeId" className="text-right">Tipo</Label>
            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                {houseTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Distrito */}
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="district" className="text-right">Distrito</Label>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o distrito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Distritos</SelectItem>
                {distritosDePortugal.map((distrito) => (
                  <SelectItem key={distrito} value={distrito}>
                    {distrito}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agente */}
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="agentId" className="text-right">Agente</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Agentes</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleFilter}>Aplicar Filtro</Button>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
