"use client";

import { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const generateCondominiums = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: (i + 1).toString(),
    name: `Condomínio ${i + 1}`,
  }));

const allCondominiums = generateCondominiums(1000);

export function CondominiumNavbar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sempre mostra os primeiros 20 para a barra horizontal
  const visibleCondominiums = allCondominiums.slice(0, 20);

  // Dropdown de pesquisa (filtra todos os condomínios)
  const dropdownResults = useMemo(() => {
    if (!search) return [];
    return allCondominiums.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 10); // limitar a 10 resultados
  }, [search]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="w-full border-b border-gray-200 bg-white p-3 flex flex-col gap-2 mb-12">
      {/* Busca + Dropdown */}
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

        {/* Dropdown de resultados */}
        {search && (
          <div className="absolute top-full mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto z-20">
            {dropdownResults.length > 0 ? (
              dropdownResults.map((condo) => (
                <button
                  key={condo.id}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => {
                    setSelectedId(condo.id);
                    setSearch("");
                  }}
                >
                  {condo.name}
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

      {/* Scroll horizontal isolado (sempre visível) */}
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
          {visibleCondominiums.map((condo) => (
            <Button
              key={condo.id}
              variant={selectedId === condo.id ? "default" : "outline"}
              className="whitespace-nowrap flex-shrink-0 px-6 py-2"
              onClick={() => setSelectedId(condo.id)}
            >
              {condo.name}
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
