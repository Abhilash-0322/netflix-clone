"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { TitleDTO } from "@/lib/types";
import { formatRuntime } from "@/lib/utils";

export function EpisodeList({
  title,
  progress,
  resumeEpisodeId,
}: {
  title: TitleDTO;
  progress: Record<string, number>;
  resumeEpisodeId?: string | null;
}) {
  const seasons = title.seasons ?? [];
  const initialSeason =
    seasons.find((season) =>
      season.episodes.some(
        (episode) =>
          `${season.number}-${episode.episodeNumber}` === resumeEpisodeId,
      ),
    )?.number ?? seasons[0]?.number;
  const [seasonNumber, setSeasonNumber] = useState(initialSeason);
  const season = seasons.find((s) => s.number === seasonNumber) ?? seasons[0];

  if (!seasons.length || !season) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">Episodes</h2>
        {seasons.length > 1 ? (
          <select
            value={seasonNumber}
            onChange={(event) => setSeasonNumber(Number(event.target.value))}
            className="rounded-md border border-white/25 bg-neutral-800 px-3 py-2 text-sm font-semibold text-white outline-none hover:border-white/50"
            aria-label="Select season"
          >
            {seasons.map((s) => (
              <option key={s.number} value={s.number}>
                Season {s.number}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-neutral-400">Season 1</span>
        )}
      </div>

      <div className="divide-y divide-white/10">
        {season.episodes.map((episode) => {
          const episodeId = `${season.number}-${episode.episodeNumber}`;
          const ratio = progress[episodeId] ?? 0;
          const isResume = resumeEpisodeId === episodeId;
          return (
            <Link
              key={episodeId}
              href={`/watch/${title.slug}?episode=${episodeId}`}
              className="group flex gap-3 rounded-md p-2 transition hover:bg-white/5 md:gap-5 md:p-3"
            >
              <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-neutral-800 sm:w-40 md:w-52">
                {episode.still ? (
                  <Image
                    src={episode.still}
                    alt={episode.name}
                    fill
                    sizes="(max-width: 768px) 160px, 208px"
                    className="object-cover transition group-hover:brightness-75"
                  />
                ) : null}
                <div className="absolute inset-0 grid place-items-center bg-black/20 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                  <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-black/50 text-white">
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </span>
                </div>
                <span className="absolute bottom-1.5 left-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  EP {episode.episodeNumber}
                </span>
                {ratio > 0 ? (
                  <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/30">
                    <div
                      className="h-full bg-nf-red"
                      style={{ width: `${Math.min(100, ratio * 100)}%` }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 flex-1 py-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white md:text-base">
                    {episode.episodeNumber}. {episode.name}
                    {isResume ? (
                      <span className="ml-2 rounded bg-white/15 px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wide text-white/80">
                        Resume
                      </span>
                    ) : null}
                  </h3>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {formatRuntime(episode.runtimeMinutes)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-400 md:line-clamp-3 md:text-sm">
                  {episode.overview || "No description available."}
                </p>
                {episode.airDate ? (
                  <p className="mt-1.5 text-[11px] text-neutral-500">
                    Aired {episode.airDate}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
