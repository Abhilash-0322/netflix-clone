"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface MyListContextValue {
  ids: Set<string>;
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
}

const MyListContext = createContext<MyListContextValue | null>(null);

export function MyListProvider({
  initialIds,
  children,
}: {
  initialIds: string[];
  children: ReactNode;
}) {
  const [ids, setIds] = useState<Set<string>>(() => new Set(initialIds));
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const router = useRouter();

  const toggle = useCallback(
    async (titleId: string) => {
      const wasIn = idsRef.current.has(titleId);
      const next = new Set(idsRef.current);
      if (wasIn) next.delete(titleId);
      else next.add(titleId);
      setIds(next);

      try {
        const res = await fetch("/api/my-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titleId,
            action: wasIn ? "remove" : "add",
          }),
        });
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as { inList: boolean };
        setIds((current) => {
          const updated = new Set(current);
          if (data.inList) updated.add(titleId);
          else updated.delete(titleId);
          return updated;
        });
        router.refresh();
      } catch {
        setIds((current) => {
          const reverted = new Set(current);
          if (wasIn) reverted.add(titleId);
          else reverted.delete(titleId);
          return reverted;
        });
      }
    },
    [router],
  );

  const value = useMemo<MyListContextValue>(
    () => ({
      ids,
      has: (id: string) => ids.has(id),
      toggle,
    }),
    [ids, toggle],
  );

  return (
    <MyListContext.Provider value={value}>{children}</MyListContext.Provider>
  );
}

export function useMyList() {
  const context = useContext(MyListContext);
  if (!context) {
    throw new Error("useMyList must be used within MyListProvider");
  }
  return context;
}
