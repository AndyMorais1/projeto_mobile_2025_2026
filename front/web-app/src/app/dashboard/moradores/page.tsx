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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/api/Client";
import { Loader2, Building2, Plus, Trash2, Phone, User } from "lucide-react";

type TipoCondominio = "horizontal" | "vertical" | "misto";

interface Contato {
    telefone: string;
    entidade: string;
}

export function CreateCondominioDialog({
                                           onCreated,
                                       }: {
    onCreated?: () => void;
}) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const [nome, setNome] = React.useState("");
    const [endereco, setEndereco] = React.useState("");
    const [tipo, setTipo] = React.useState<TipoCondominio>("horizontal");

    const [contatos, setContatos] = React.useState<Contato[]>([
        { telefone: "", entidade: "" },
    ]);

    const resetForm = () => {
        setNome("");
        setEndereco("");
        setTipo("horizontal");
        setContatos([{ telefone: "", entidade: "" }]);
    };

    function addContato() {
        setContatos([...contatos, { telefone: "", entidade: "" }]);
    }

    function removeContato(index: number) {
        setContatos(contatos.filter((_, i) => i !== index));
    }

    function updateContato(index: number, field: keyof Contato, value: string) {
        const updated = [...contatos];
        updated[index][field] = value;
        setContatos(updated);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!nome || !endereco || !tipo) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        try {
            setLoading(true);

            // 1️⃣ cria o condomínio
            const { data, error } = await supabase
                .from("condominio")
                .insert({ nome, endereco, tipo_condominio: tipo })
                .select("id")
                .single();

            if (error) throw error;
            const condominioId = data.id;

            // 2️⃣ cria os contatos (se houver)
            const contatosValidos = contatos.filter(
                (c) => c.telefone.trim() && c.entidade.trim()
            );

            if (contatosValidos.length > 0) {
                const { error: contatosErr } = await supabase
                    .from("contato_condominio")
                    .insert(
                        contatosValidos.map((c) => ({
                            condominio_id: condominioId,
                            telefone: c.telefone,
                            entidade: c.entidade,
                        }))
                    );
                if (contatosErr) throw contatosErr;
            }

            toast.success("Condomínio criado com sucesso!");
            resetForm();
            setOpen(false);
            onCreated?.();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Falha ao criar condomínio");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Novo condomínio
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" /> Criar Condomínio
                    </DialogTitle>
                    <DialogDescription>
                        Preencha os campos abaixo para adicionar um novo condomínio e seus
                        contactos.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Campos principais */}
                    <div className="grid gap-3">
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                            id="nome"
                            placeholder="Ex: Condomínio Jardim das Flores"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="endereco">Endereço</Label>
                        <Textarea
                            id="endereco"
                            placeholder="Rua, número, bairro, cidade..."
                            value={endereco}
                            onChange={(e) => setEndereco(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="tipo">Tipo de condomínio</Label>
                        <Select value={tipo} onValueChange={(v: TipoCondominio) => setTipo(v)}>
                            <SelectTrigger id="tipo">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="horizontal">Horizontal</SelectItem>
                                <SelectItem value="vertical">Vertical</SelectItem>
                                <SelectItem value="misto">Misto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Contatos */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Contactos</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addContato}
                            >
                                <Plus className="h-4 w-4 mr-1" /> Adicionar
                            </Button>
                        </div>

                        {contatos.map((c, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end border rounded-xl p-3"
                            >
                                <div className="grid gap-2">
                                    <Label className="flex items-center gap-1">
                                        <Phone className="size-3" /> Telefone
                                    </Label>
                                    <Input
                                        placeholder="Ex: 912345678"
                                        value={c.telefone}
                                        onChange={(e) =>
                                            updateContato(i, "telefone", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="flex items-center gap-1">
                                        <User className="size-3" /> Entidade
                                    </Label>
                                    <Input
                                        placeholder="Ex: Síndico, Porteiro, Empresa de limpeza"
                                        value={c.entidade}
                                        onChange={(e) =>
                                            updateContato(i, "entidade", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex justify-end">
                                    {contatos.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeContato(i)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <DialogFooter className="mt-6 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...
                                </>
                            ) : (
                                "Criar"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
