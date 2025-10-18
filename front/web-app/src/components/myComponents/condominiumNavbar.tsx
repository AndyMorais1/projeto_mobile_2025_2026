"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { supabase } from "@/api/Client";
import { useCondominium } from "@/context/CondominiumProvider";

export function CondominiumNavbar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { selected, setSelected } = useCondominium();
  const [condominiums, setCondominiums] = useState<{ id: string; nome: string }[]>([]);
  const [search, setSearch] = useState("");

  // 🔹 Carrega condomínios
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("condominio")
        .select("id, nome")
        .order("created_at");

      if (!error && data) {
        setCondominiums(data);

        // ✅ Se ainda não houver condomínio selecionado, escolhe o primeiro automaticamente
        if (!selected && data.length > 0) {
          setSelected(data[0]);
        }
      }
    })();
  }, [selected, setSelected]);

  const visible = condominiums.slice(0, 20);

  const dropdownResults = useMemo(() => {
    if (!search) return [];
    return condominiums
      .filter((c) => c.nome.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 10);
  }, [search, condominiums]);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current)
      scrollRef.current.scrollBy({
        left: dir === "left" ? -300 : 300,
        behavior: "smooth",
      });
  };

  return (
    <div className="w-full border-b border-gray-200 bg-white p-3 flex flex-col gap-2 mb-12">
      {/* Busca */}
      <div className="relative max-w-md px-2">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar condomínio..."
            className="flex-1 border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {search && (
          <div className="absolute top-full mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto z-20">
            {dropdownResults.length > 0 ? (
              dropdownResults.map((condo) => (
                <button
                  key={condo.id}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => {
                    setSelected(condo);
                    setSearch("");
                  }}
                >
                  {condo.nome}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-gray-500">
                Nenhum condomínio encontrado
              </p>
            )}
          </div>
        )}
      </div>

      {/* Scroll horizontal */}
      <div className="relative w-full overflow-hidden px-10">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow"
          onClick={() => scroll("left")}
        >
          <ChevronLeft />
        </Button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto py-5 scrollbar-hide scroll-smooth w-full"
        >
          {visible.map((condo) => (
            <Button
              key={condo.id}
              variant={selected?.id === condo.id ? "default" : "outline"}
              className="whitespace-nowrap flex-shrink-0 px-6 py-2"
              onClick={() => setSelected(condo)}
            >
              {condo.nome}
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow"
          onClick={() => scroll("right")}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
