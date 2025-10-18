"use client";

import React, { createContext, useContext, useState } from "react";

export type Condominium = {
  id: string;
  nome: string;
};

type CondominiumContextType = {
  selected: Condominium | null;
  setSelected: (c: Condominium | null) => void;
};

const CondominiumContext = createContext<CondominiumContextType | undefined>(undefined);

export function CondominiumProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Condominium | null>(null);

  return (
    <CondominiumContext.Provider value={{ selected, setSelected }}>
      {children}
    </CondominiumContext.Provider>
  );
}

export function useCondominium() {
  const ctx = useContext(CondominiumContext);
  if (!ctx) throw new Error("useCondominium must be used within a CondominiumProvider");
  return ctx;
}
