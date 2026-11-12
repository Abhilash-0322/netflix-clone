import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import {
  getMoreLikeThis,
  getRatingsMap,
  getTitleBySlug,
  getTitleProgress,
} from "@/lib/data";
import { MyListButton } from "@/components/MyListButton";
import { RatingButtons } from "@/components/RatingButtons";
import { EpisodeList } from "@/components/EpisodeList";
import { Row } from "@/components/Row";
import {
  formatRuntime,
  matchPercent,
  totalEpisodes,
} from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = await getTitleBySlug(slug);
  return {
    title: title?.name ?? "Title",
    description: title?.overview,
  };
}

export default async function TitlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { profile } = await requireProfile();
  const { slug } = await params;
  const title = await getTitleBySlug(slug, profile.isKids);
  if (!title) notFound();

  const [progressInfo, ratingsMap, moreLike] = await Promise.all([
    getTitleProgress(profile.id, title.id),
    getRatingsMap(profile.id),
    getMoreLikeThis(title, profile.isKids),
  ]);

  const firstSeason = title.seasons?.[0];
  const firstEpisode = firstSeason?.episodes[0];
  let watchHref = `/watch/${title.slug}`;
  let watchLabel = "Play";

  if (title.type === "series") {
    const episodeId =
      progressInfo.latest?.episodeId ??
      (firstSeason && firstEpisode
        ? `${firstSeason.number}-${firstEpisode.episodeNumber}`
        : null);
    if (episodeId) watchHref += `?episode=${episodeId}`;
    if (progressInfo.latest) watchLabel = "Resume";
  } else if (progressInfo.latest && progressInfo.latest.position > 2) {
    watchLabel = "Resume";
  }

  const match = matchPercent(title.voteAverage);
  const seasonsCount = title.seasons?.length ?? 0;
  const episodesCount = totalEpisodes(title.seasons);

  return (
    <article>
      <div className="relative h-[78vh] min-h-[520px] w-full">
        <Image
          src={title.backdrop}
          alt={title.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />

        <Link
          href="/browse"
          aria-label="Back to browse"
          className="absolute left-4 top-20 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/80 md:left-12"
        >
          <ArrowLeft size={20} />
        </Link>

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-10 md:px-12 md:pb-14">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-white/90">
              <span className="text-nf-red">N</span>
              {title.type === "series" ? "SERIES" : "FILM"}
            </p>
            <h1 className="text-shadow-hero text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
              {title.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/90">
              <span className="font-bold text-green-400">{match}% Match</span>
              <span>{title.year}</span>
              <span className="rounded border border-white/40 px-1.5 py-0.5 text-xs">
                {title.maturity}
              </span>
              <span>
                {title.type === "series"
                  ? `${seasonsCount} Season${seasonsCount === 1 ? "" : "s"} · ${episodesCount} Episodes`
                  : formatRuntime(title.runtimeMinutes)}
              </span>
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
                HD
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={watchHref}
                className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/80 md:px-7 md:text-base"
              >
                <Play size={21} fill="currentColor" /> {watchLabel}
              </Link>
              <MyListButton titleId={title.id} variant="pill" />
              <RatingButtons
                titleId={title.id}
                initialValue={ratingsMap.get(title.id) ?? 0}
              />
            </div>

            <p className="mt-5 line-clamp-4 max-w-2xl text-sm leading-relaxed text-white/90 md:text-base">
              {title.overview}
            </p>

            <div className="mt-4 space-y-1 text-xs text-white/60 md:text-sm">
              {title.cast.length ? (
                <p>
                  <span className="text-white/40">Cast:</span>{" "}
                  {title.cast.slice(0, 6).join(", ")}
                </p>
              ) : null}
              <p>
                <span className="text-white/40">Genres:</span>{" "}
                {title.genres.map((genre, index) => (
                  <span key={genre}>
                    <Link
                      href={`/browse/genre/${encodeURIComponent(genre)}`}
                      className="hover:text-white hover:underline"
                    >
                      {genre}
                    </Link>
                    {index < title.genres.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {title.type === "series" && title.seasons?.length ? (
        <div className="px-4 md:px-12">
          <EpisodeList
            title={title}
            progress={progressInfo.ratios}
            resumeEpisodeId={progressInfo.latest?.episodeId ?? null}
          />
        </div>
      ) : null}

      <div className="mt-10 space-y-10 pb-4">
        {moreLike.length ? (
          <Row
            title="More Like This"
            items={moreLike.map((item) => ({ title: item }))}
          />
        ) : null}

        <section className="px-4 md:px-12">
          <h2 className="mb-4 text-xl font-bold text-white">About {title.name}</h2>
          <div className="max-w-3xl space-y-2 text-sm text-neutral-400">
            <p>
              <span className="text-neutral-500">Genres:</span>{" "}
              {title.genres.join(", ")}
            </p>
            <p>
              <span className="text-neutral-500">Maturity rating:</span>{" "}
              <span className="rounded border border-white/30 px-1 text-xs text-white/70">
                {title.maturity}
              </span>{" "}
              — recommended for mature audiences
            </p>
            {title.cast.length ? (
              <p>
                <span className="text-neutral-500">Cast:</span>{" "}
                {title.cast.join(", ")}
              </p>
            ) : null}
            <p>
              <span className="text-neutral-500">Audio:</span> English —
              Audio Description, 5.1
            </p>
            <p>
              <span className="text-neutral-500">Subtitles:</span> English
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}
