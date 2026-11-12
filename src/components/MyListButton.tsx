"use client";

import { useState, type MouseEvent } from "react";
import { Check, Plus } from "lucide-react";
import { useMyList } from "./MyListProvider";
import { cn } from "@/lib/utils";

export function MyListButton({
  titleId,
  variant = "icon",
  className,
  showLabel = true,
}: {
  titleId: string;
  variant?: "icon" | "pill";
  className?: string;
  showLabel?: boolean;
}) {
  const { has, toggle } = useMyList();
  const [busy, setBusy] = useState(false);
  const inList = has(titleId);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    await toggle(titleId);
    setBusy(false);
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={inList}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-white/30 bg-neutral-800/70 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-neutral-700/80",
          busy && "opacity-60",
          className,
        )}
      >
        {inList ? <Check size={20} /> : <Plus size={20} />}
        <span>{inList ? "My List" : "My List"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={inList ? "Remove from My List" : "Add to My List"}
      aria-pressed={inList}
      className={cn(
        "grid place-items-center rounded-full border-2 border-white/60 bg-black/50 text-white transition hover:border-white hover:bg-black/80",
        busy && "opacity-60",
        showLabel ? "h-10 w-10" : "h-9 w-9",
        className,
      )}
    >
      {inList ? <Check size={18} /> : <Plus size={18} />}
    </button>
  );
}
