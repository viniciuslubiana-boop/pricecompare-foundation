import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useActiveBaseCompanies } from "../hooks/useBaseCompanies";
import type { BaseCompany } from "../types";

const STORAGE_KEY = "pcm.selectedBaseCompanyId";

interface Ctx {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selected: BaseCompany | null;
  active: BaseCompany[];
  isLoading: boolean;
  hasAny: boolean;
}

const SelectedBaseCompanyContext = createContext<Ctx | null>(null);

export function SelectedBaseCompanyProvider({ children }: { children: ReactNode }) {
  const { data: active = [], isLoading } = useActiveBaseCompanies();
  const [selectedId, setSelectedIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIdState(id);
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Garante seleção válida: se a empresa selecionada não está mais ativa, escolhe a primeira.
  useEffect(() => {
    if (isLoading) return;
    if (active.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    const valid = selectedId && active.some((c) => c.id === selectedId);
    if (!valid) setSelectedId(active[0].id);
  }, [active, isLoading, selectedId, setSelectedId]);

  const selected = useMemo(
    () => active.find((c) => c.id === selectedId) ?? null,
    [active, selectedId],
  );

  const value: Ctx = {
    selectedId,
    setSelectedId,
    selected,
    active,
    isLoading,
    hasAny: active.length > 0,
  };

  return (
    <SelectedBaseCompanyContext.Provider value={value}>
      {children}
    </SelectedBaseCompanyContext.Provider>
  );
}

export function useSelectedBaseCompany(): Ctx {
  const ctx = useContext(SelectedBaseCompanyContext);
  if (!ctx)
    throw new Error("useSelectedBaseCompany deve estar dentro de SelectedBaseCompanyProvider");
  return ctx;
}
