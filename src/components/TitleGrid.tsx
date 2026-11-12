import type { TitleDTO } from "@/lib/types";
import { TitleCard } from "./TitleCard";

export function TitleGrid({
  items,
  emptyMessage = "Nothing to show here yet.",
}: {
  items: TitleDTO[];
  emptyMessage?: string;
}) {
  if (!items.length) {
    return (
      <p className="rounded-lg border border-white/10 bg-neutral-900/60 p-8 text-sm text-neutral-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((title, index) => (
        <TitleCard
          key={title.id}
          title={title}
          orientation="poster"
          priority={index < 6}
          className="w-full"
        />
      ))}
    </div>
  );
}
