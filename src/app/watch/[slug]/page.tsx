import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import {
  getEpisode,
  getNextEpisode,
  getProgressFor,
  getTitleBySlug,
  getTitleProgress,
} from "@/lib/data";
import { Player } from "@/components/Player";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = await getTitleBySlug(slug);
  return { title: title ? `Watch ${title.name}` : "Watch" };
}

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ episode?: string }>;
}) {
  const { profile } = await requireProfile();
  const { slug } = await params;
  const query = await searchParams;

  const title = await getTitleBySlug(slug, profile.isKids);
  if (!title) notFound();

  let episodeId: string | null = null;

  if (title.type === "series") {
    const firstSeason = title.seasons?.[0];
    const firstEpisode = firstSeason?.episodes[0];
    const firstId =
      firstSeason && firstEpisode
        ? `${firstSeason.number}-${firstEpisode.episodeNumber}`
        : null;

    let candidate = query.episode ?? null;
    if (!candidate) {
      const info = await getTitleProgress(profile.id, title.id);
      candidate = info.latest?.episodeId ?? firstId;
    }
    episodeId = getEpisode(title, candidate) ? candidate : firstId;
  }

  const episode = getEpisode(title, episodeId);
  const progress = await getProgressFor(profile.id, title.id, episodeId);
  const nextEpisode = getNextEpisode(title, episodeId);

  let startAt = 0;
  if (progress && progress.duration > 0) {
    const ratio = progress.position / progress.duration;
    if (ratio < 0.97) startAt = progress.position;
  }

  return (
    <Player
      titleId={title.id}
      titleName={title.name}
      titleSlug={title.slug}
      videoUrl={episode?.videoUrl ?? title.videoUrl}
      poster={title.backdrop}
      startAt={startAt}
      episodeId={episodeId}
      episodeLabel={episode?.label ?? null}
      nextEpisode={nextEpisode}
      backHref={`/title/${title.slug}`}
      maturity={title.maturity}
      year={title.year}
    />
  );
}
