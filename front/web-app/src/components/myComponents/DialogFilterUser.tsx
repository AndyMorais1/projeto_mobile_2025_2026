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
import { Filter } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface FilterData {
  role?: string | null;
}

export function DialogFilterUser({
  onFilter,
}: {
  onFilter: (filters: FilterData) => void;
}) {
  const [role, setRole] = React.useState<string | null>("none");
  const [isOpen, setIsOpen] = React.useState(false);

  const handleRoleChange = (value: string) => {
    setRole(value === "none" ? null : value);
  };

  const handleSubmit = () => {
    onFilter({ role });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar</DialogTitle>
          <DialogDescription>
            Selecione os filtros desejados para visualizar os usuários.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="role" className="text-right font-medium">
              Tipo
            </label>
            <Select value={role || "none"} onValueChange={handleRoleChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos os tipos</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="CLIENT">Cliente</SelectItem>
                <SelectItem value="AGENT">Agente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>
            Apply
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
