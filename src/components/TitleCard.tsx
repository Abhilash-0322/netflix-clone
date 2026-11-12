"use client";

import Link from "next/link";
import Image from "next/image";
import { Info, Play } from "lucide-react";
import type { TitleDTO } from "@/lib/types";
import { cn, matchPercent } from "@/lib/utils";
import { MyListButton } from "./MyListButton";

export function TitleCard({
  title,
  orientation = "landscape",
  progress,
  episodeId,
  episodeLabel,
  className,
  priority = false,
  rank,
}: {
  title: TitleDTO;
  orientation?: "landscape" | "poster";
  progress?: { position: number; duration: number };
  episodeId?: string | null;
  episodeLabel?: string | null;
  className?: string;
  priority?: boolean;
  rank?: number;
}) {
  const isLandscape = orientation === "landscape";
  const image = isLandscape ? title.backdrop : title.poster;
  const playHref = episodeId
    ? `/watch/${title.slug}?episode=${episodeId}`
    : `/watch/${title.slug}`;
  const percent =
    progress && progress.duration > 0
      ? Math.min(100, Math.max(2, (progress.position / progress.duration) * 100))
      : 0;
  const match = matchPercent(title.voteAverage);

  return (
    <div
      className={cn(
        "group/card relative shrink-0 transition-transform duration-200 hover:z-30 hover:scale-[1.04]",
        className,
      )}
    >
      <Link
        href={`/title/${title.slug}`}
        className="block overflow-hidden rounded-md bg-neutral-800 shadow-lg shadow-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <div
          className={cn(
            "relative w-full overflow-hidden",
            isLandscape ? "aspect-video" : "aspect-[2/3]",
          )}
        >
          {image ? (
            <Image
              src={image}
              alt={title.name}
              fill
              priority={priority}
              sizes={
                isLandscape
                  ? "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 300px"
                  : "(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 200px"
              }
              className="object-cover transition duration-300 group-hover/card:brightness-[0.65]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-neutral-800 text-sm text-neutral-400">
              {title.name}
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

          {rank ? (
            <span
              className="pointer-events-none absolute left-1 top-0 select-none text-4xl font-black italic leading-none text-white/95 sm:text-5xl"
              style={{
                WebkitTextStroke: "2px rgba(0,0,0,0.7)",
                textShadow: "2px 3px 8px rgba(0,0,0,0.8)",
              }}
            >
              {rank}
            </span>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <div className="flex items-end justify-between gap-2">
              <p className="line-clamp-1 text-xs font-semibold text-white sm:text-sm">
                {title.name}
              </p>
              <span className="shrink-0 text-[10px] font-bold text-green-400">
                {match}% Match
              </span>
            </div>
            {episodeLabel ? (
              <p className="mt-0.5 line-clamp-1 text-[10px] text-white/70">
                {episodeLabel}
              </p>
            ) : null}
          </div>

          {progress && progress.duration > 0 ? (
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/30">
              <div
                className="h-full bg-nf-red"
                style={{ width: `${percent}%` }}
              />
            </div>
          ) : null}
        </div>
      </Link>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end rounded-md bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
        <div className="p-2.5">
          <div className="mb-2 flex items-center gap-1.5">
            <Link
              href={playHref}
              aria-label={`Play ${title.name}`}
              className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white text-black transition hover:bg-white/80"
            >
              <Play size={16} fill="currentColor" />
            </Link>
            <div className="pointer-events-auto">
              <MyListButton titleId={title.id} />
            </div>
            <Link
              href={`/title/${title.slug}`}
              aria-label={`More info about ${title.name}`}
              className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full border-2 border-white/60 bg-black/50 text-white transition hover:border-white"
            >
              <Info size={16} />
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-white/80">
            <span className="font-bold text-green-400">{match}% Match</span>
            <span className="rounded border border-white/40 px-1 text-[9px] leading-4">
              {title.maturity}
            </span>
            <span>{title.year}</span>
            <span>
              {title.type === "series" ? "Series" : `${title.runtimeMinutes}m`}
            </span>
            <span className="rounded bg-white/20 px-1 text-[9px] leading-4">
              HD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
