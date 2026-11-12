"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RowItem } from "@/lib/types";
import { TitleCard } from "./TitleCard";
import { cn } from "@/lib/utils";

export function Row({
  title,
  items,
  href,
  orientation = "landscape",
  className,
  ranked = false,
}: {
  title: string;
  items: RowItem[];
  href?: string;
  orientation?: "landscape" | "poster";
  className?: string;
  ranked?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  function scroll(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  if (!items.length) return null;

  return (
    <section className={cn("group/row relative", className)}>
      <div className="mb-2 flex items-end justify-between px-4 md:px-12">
        <h2 className="text-base font-semibold text-white/90 md:text-xl">
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-xs font-semibold text-neutral-300 opacity-0 transition hover:text-white group-hover/row:opacity-100"
          >
            Explore All <ChevronRight size={14} />
          </Link>
        ) : null}
      </div>

      <div className="relative">
        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="absolute left-0 top-0 z-40 flex h-full w-8 items-center justify-center bg-gradient-to-r from-black/80 to-transparent text-white opacity-0 transition hover:from-black group-hover/row:opacity-100 md:w-12"
          >
            <ChevronLeft size={28} />
          </button>
        ) : null}

        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth px-4 pb-1 md:gap-2.5 md:px-12"
        >
          {items.map((item, index) => (
            <TitleCard
              key={`${title}-${item.title.id}`}
              title={item.title}
              rank={ranked ? index + 1 : undefined}
              orientation={orientation}
              progress={item.progress}
              episodeId={item.episodeId}
              episodeLabel={item.episodeLabel}
              className={
                orientation === "landscape"
                  ? "w-[45vw] max-w-[280px] sm:w-[240px] md:w-[260px] lg:w-[290px]"
                  : "w-[32vw] max-w-[180px] sm:w-[150px] md:w-[165px]"
              }
            />
          ))}
        </div>

        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="absolute right-0 top-0 z-40 flex h-full w-8 items-center justify-center bg-gradient-to-l from-black/80 to-transparent text-white opacity-0 transition hover:from-black group-hover/row:opacity-100 md:w-12"
          >
            <ChevronRight size={28} />
          </button>
        ) : null}
      </div>
    </section>
  );
}
