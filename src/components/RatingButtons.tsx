"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingButtons({
  titleId,
  initialValue,
}: {
  titleId: string;
  initialValue: 1 | -1 | 0;
}) {
  const [value, setValue] = useState<1 | -1 | 0>(initialValue);
  const [busy, setBusy] = useState(false);

  async function rate(next: 1 | -1) {
    if (busy) return;
    const target = value === next ? 0 : next;
    const previous = value;
    setValue(target);
    setBusy(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId, value: target }),
      });
      if (!res.ok) setValue(previous);
    } catch {
      setValue(previous);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => rate(1)}
        aria-label="I like this"
        aria-pressed={value === 1}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full border-2 text-white transition",
          value === 1
            ? "border-white bg-white/10"
            : "border-white/40 bg-black/40 hover:border-white",
        )}
      >
        <ThumbsUp size={18} fill={value === 1 ? "currentColor" : "none"} />
      </button>
      <button
        type="button"
        onClick={() => rate(-1)}
        aria-label="I do not like this"
        aria-pressed={value === -1}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full border-2 text-white transition",
          value === -1
            ? "border-white bg-white/10"
            : "border-white/40 bg-black/40 hover:border-white",
        )}
      >
        <ThumbsDown size={18} fill={value === -1 ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
