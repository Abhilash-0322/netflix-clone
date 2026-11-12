"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, Play } from "lucide-react";
import type { TitleDTO } from "@/lib/types";
import { cn, matchPercent } from "@/lib/utils";
import { MyListButton } from "./MyListButton";

export function Billboard({ titles }: { titles: TitleDTO[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (titles.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % titles.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [titles.length, paused]);

  if (!titles.length) return null;
  const title = titles[index];
  const match = matchPercent(title.voteAverage);
  const tag = title.type === "series" ? "SERIES" : "FILM";

  return (
    <section
      className="relative h-[92vh] min-h-[600px] w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div key={title.id} className="absolute inset-0 animate-fade-in">
        <Image
          src={title.backdrop}
          alt={title.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-hero-fade" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-24 md:justify-center md:px-12 md:pb-0">
        <div className="max-w-xl animate-fade-in md:max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-white/90">
            <span className="text-nf-red">N</span>
            {tag}
          </p>
          <h1 className="text-shadow-hero line-clamp-3 text-4xl font-black leading-[1.05] text-white sm:text-5xl md:text-7xl">
            {title.name}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-white/90">
            <span className="font-bold text-green-400">{match}% Match</span>
            <span>{title.year}</span>
            <span className="rounded border border-white/40 px-1.5 py-0.5 text-xs">
              {title.maturity}
            </span>
            <span>
              {title.type === "series"
                ? `${title.seasonCount} Season${title.seasonCount === 1 ? "" : "s"}`
                : `${Math.floor(title.runtimeMinutes / 60)}h ${title.runtimeMinutes % 60}m`}
            </span>
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
              HD
            </span>
          </div>
          <p className="text-shadow-hero mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-white/90 md:text-lg">
            {title.overview}
          </p>

          <div className="mt-7 flex items-center gap-3">
            <Link
              href={`/watch/${title.slug}`}
              className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/80 md:px-8 md:py-3 md:text-base"
            >
              <Play size={22} fill="currentColor" /> Play
            </Link>
            <Link
              href={`/title/${title.slug}`}
              className="inline-flex items-center gap-2 rounded-md bg-neutral-600/80 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-500/80 md:px-8 md:py-3 md:text-base"
            >
              <Info size={22} /> More Info
            </Link>
            <div className="ml-auto md:ml-0">
              <MyListButton titleId={title.id} className="h-11 w-11" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-4 z-20 flex items-center gap-2 md:bottom-10 md:right-12">
        {titles.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Show ${item.name}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index
                ? "w-6 bg-nf-red"
                : "w-1.5 bg-white/40 hover:bg-white/70",
            )}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-40 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
}
