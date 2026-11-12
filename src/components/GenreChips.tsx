import Link from "next/link";
import { GENRES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function GenreChips({ current }: { current?: string }) {
  return (
    <div className="no-scrollbar -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
      {GENRES.map((genre) => {
        const active = current?.toLowerCase() === genre.toLowerCase();
        return (
          <Link
            key={genre}
            href={`/browse/genre/${encodeURIComponent(genre)}`}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
              active
                ? "border-white bg-white text-black"
                : "border-white/25 bg-black/40 text-neutral-300 hover:border-white/60 hover:text-white",
            )}
          >
            {genre}
          </Link>
        );
      })}
    </div>
  );
}
