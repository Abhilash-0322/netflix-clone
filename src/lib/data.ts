import { ObjectId } from "mongodb";
import { FEATURED_SLUGS } from "./constants";
import { ensureSeeded } from "./seed";
import { myList, progress, ratings, titles } from "./db";
import type {
  BrowseRow,
  ContinueWatchingItem,
  ProgressDTO,
  TitleDoc,
  TitleDTO,
} from "./types";

export function tmdbImage(
  path: string | null | undefined,
  size: string,
): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/${size}/${path}`;
}

function toDTO(doc: TitleDoc, includeSeasons = false): TitleDTO {
  const backdrop = tmdbImage(doc.backdrop || doc.poster, "w1920");
  return {
    id: doc._id!.toString(),
    tmdbId: doc.tmdbId,
    slug: doc.slug,
    name: doc.name,
    type: doc.type,
    overview: doc.overview,
    year: doc.year,
    genres: doc.genres,
    voteAverage: doc.voteAverage,
    voteCount: doc.voteCount,
    runtimeMinutes: doc.runtimeMinutes,
    cast: doc.cast,
    poster: tmdbImage(doc.poster, "w500"),
    backdrop,
    videoUrl: doc.videoUrl,
    maturity: doc.maturity,
    seasonCount: doc.seasons?.length ?? 0,
    episodeCount:
      doc.seasons?.reduce((sum, season) => sum + season.episodes.length, 0) ??
      0,
    featured: doc.featured,
    trending: doc.trending,
    newRelease: doc.newRelease,
    kidsFriendly: doc.kidsFriendly,
    seasons: includeSeasons
      ? doc.seasons?.map((season) => ({
          ...season,
          episodes: season.episodes.map((episode) => ({
            ...episode,
            still: episode.still || tmdbImage(doc.backdrop, "w780"),
            videoUrl: episode.videoUrl || doc.videoUrl,
          })),
        }))
      : undefined,
  };
}

function objId(value: string): ObjectId | null {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

export async function getAllTitles(kids = false): Promise<TitleDTO[]> {
  await ensureSeeded();
  const col = await titles();
  const docs = await col
    .find(kids ? { kidsFriendly: true } : {})
    .sort({ name: 1 })
    .toArray();
  return docs.map((doc) => toDTO(doc));
}

export async function getTitleBySlug(
  slug: string,
  kids = false,
): Promise<TitleDTO | null> {
  await ensureSeeded();
  const col = await titles();
  const doc = await col.findOne({ slug });
  if (!doc) return null;
  const dto = toDTO(doc, true);
  if (kids && !dto.kidsFriendly) return null;
  return dto;
}

export async function getTitlesByIds(
  ids: string[],
  kids = false,
): Promise<TitleDTO[]> {
  await ensureSeeded();
  const objectIds = ids.map(objId).filter((v): v is ObjectId => v !== null);
  if (!objectIds.length) return [];
  const col = await titles();
  const docs = await col
    .find({ _id: { $in: objectIds }, ...(kids ? { kidsFriendly: true } : {}) })
    .toArray();
  const order = new Map(ids.map((id, i) => [id, i]));
  return docs
    .map((doc) => toDTO(doc))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function getFeaturedTitles(kids = false): Promise<TitleDTO[]> {
  await ensureSeeded();
  const col = await titles();
  const docs = await col.find({ featured: true }).toArray();
  const dtos = docs.map((doc) => toDTO(doc)).filter((t) => !kids || t.kidsFriendly);
  return dtos.sort((a, b) => {
    const ai = FEATURED_SLUGS.indexOf(a.slug);
    const bi = FEATURED_SLUGS.indexOf(b.slug);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export async function getLandingFeatured(): Promise<TitleDTO | null> {
  const featured = await getFeaturedTitles(false);
  return featured[0] ?? null;
}

export async function getMyListIds(profileId: string): Promise<string[]> {
  const pid = objId(profileId);
  if (!pid) return [];
  const col = await myList();
  const docs = await col.find({ profileId: pid }).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => d.titleId.toString());
}

export async function getMyListTitles(
  profileId: string,
  kids = false,
): Promise<TitleDTO[]> {
  const ids = await getMyListIds(profileId);
  return getTitlesByIds(ids, kids);
}

export async function getProgressMap(
  profileId: string,
): Promise<Map<string, ProgressDTO>> {
  const pid = objId(profileId);
  const map = new Map<string, ProgressDTO>();
  if (!pid) return map;
  const col = await progress();
  const docs = await col.find({ profileId: pid }).toArray();
  for (const doc of docs) {
    map.set(doc.titleId.toString(), {
      titleId: doc.titleId.toString(),
      episodeId: doc.episodeId,
      position: doc.position,
      duration: doc.duration,
      updatedAt: doc.updatedAt.toISOString(),
    });
  }
  return map;
}

export async function getProgressFor(
  profileId: string,
  titleId: string,
  episodeId: string | null,
): Promise<ProgressDTO | null> {
  const pid = objId(profileId);
  const tid = objId(titleId);
  if (!pid || !tid) return null;
  const col = await progress();
  const doc = await col.findOne({
    profileId: pid,
    titleId: tid,
    episodeId: episodeId ?? null,
  });
  if (!doc) return null;
  return {
    titleId: doc.titleId.toString(),
    episodeId: doc.episodeId,
    position: doc.position,
    duration: doc.duration,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function getTitleProgress(
  profileId: string,
  titleId: string,
): Promise<{
  ratios: Record<string, number>;
  latest: { episodeId: string | null; position: number; duration: number } | null;
}> {
  const pid = objId(profileId);
  const tid = objId(titleId);
  if (!pid || !tid) return { ratios: {}, latest: null };
  const col = await progress();
  const docs = await col
    .find({ profileId: pid, titleId: tid })
    .sort({ updatedAt: -1 })
    .toArray();
  const ratios: Record<string, number> = {};
  for (const doc of docs) {
    if (doc.duration <= 0) continue;
    ratios[doc.episodeId ?? "movie"] = doc.position / doc.duration;
  }
  const first = docs[0];
  return {
    ratios,
    latest: first
      ? {
          episodeId: first.episodeId,
          position: first.position,
          duration: first.duration,
        }
      : null,
  };
}

export async function getRatingsMap(
  profileId: string,
): Promise<Map<string, 1 | -1>> {
  const pid = objId(profileId);
  const map = new Map<string, 1 | -1>();
  if (!pid) return map;
  const col = await ratings();
  const docs = await col.find({ profileId: pid }).toArray();
  for (const doc of docs) map.set(doc.titleId.toString(), doc.value);
  return map;
}

function episodeLabel(
  doc: TitleDoc | undefined,
  episodeId: string | null,
): string | null {
  if (!episodeId || !doc?.seasons) return null;
  const [seasonNumber, episodeNumber] = episodeId.split("-").map(Number);
  const season = doc.seasons.find((s) => s.number === seasonNumber);
  const episode = season?.episodes.find(
    (e) => e.episodeNumber === episodeNumber,
  );
  if (!episode) return null;
  return `S${seasonNumber}:E${episodeNumber} ${episode.name}`;
}

export async function getContinueWatching(
  profileId: string,
  kids = false,
): Promise<ContinueWatchingItem[]> {
  const pid = objId(profileId);
  if (!pid) return [];
  const col = await progress();
  const docs = await col.find({ profileId: pid }).sort({ updatedAt: -1 }).toArray();
  const titleCol = await titles();
  const titleIds = docs.map((d) => d.titleId);
  if (!titleIds.length) return [];
  const titleDocs = await titleCol.find({ _id: { $in: titleIds } }).toArray();
  const byId = new Map(titleDocs.map((d) => [d._id!.toString(), toDTO(d)]));
  const rawById = new Map(titleDocs.map((d) => [d._id!.toString(), d]));

  const items: ContinueWatchingItem[] = [];
  for (const doc of docs) {
    const title = byId.get(doc.titleId.toString());
    if (!title || (kids && !title.kidsFriendly)) continue;
    if (doc.duration <= 0) continue;
    const ratio = doc.position / doc.duration;
    if (ratio >= 0.97 || doc.position < 2) continue;
    items.push({
      title,
      progress: {
        titleId: doc.titleId.toString(),
        episodeId: doc.episodeId,
        position: doc.position,
        duration: doc.duration,
        updatedAt: doc.updatedAt.toISOString(),
      },
      episodeLabel: episodeLabel(
        rawById.get(doc.titleId.toString()),
        doc.episodeId,
      ),
    });
    if (items.length >= 20) break;
  }
  return items;
}

function byRating(a: TitleDTO, b: TitleDTO) {
  return b.voteAverage - a.voteAverage;
}

function byPopularity(a: TitleDTO, b: TitleDTO) {
  return b.voteCount - a.voteCount;
}

export async function getBrowseData(
  profileId: string,
  kids = false,
): Promise<{
  featured: TitleDTO[];
  rows: BrowseRow[];
  continueWatching: ContinueWatchingItem[];
}> {
  const [all, featured, continueWatching, myListIds] = await Promise.all([
    getAllTitles(kids),
    getFeaturedTitles(kids),
    getContinueWatching(profileId, kids),
    getMyListIds(profileId),
  ]);

  const myListSet = new Set(myListIds);
  const rows: BrowseRow[] = [];

  if (myListSet.size > 0) {
    rows.push({
      key: "my-list",
      title: "My List",
      items: all.filter((t) => myListSet.has(t.id)),
      href: "/my-list",
    });
  }

  const trending = [...all]
    .filter((t) => t.trending)
    .sort(byPopularity)
    .slice(0, 20);
  if (trending.length >= 4) {
    rows.push({ key: "trending", title: "Trending Now", items: trending });
  }

  if (trending.length >= 4) {
    rows.push({
      key: "top10",
      title: "Top 10 in Your Country Today",
      items: trending.slice(0, 10),
      ranked: true,
    });
  }

  const lastWatched = continueWatching[0];
  if (lastWatched) {
    const seedGenres = new Set(lastWatched.title.genres);
    const because = [...all]
      .filter(
        (t) =>
          t.id !== lastWatched.title.id &&
          t.genres.some((g) => seedGenres.has(g)),
      )
      .sort(
        (a, b) =>
          b.genres.filter((g) => seedGenres.has(g)).length -
            a.genres.filter((g) => seedGenres.has(g)).length ||
          b.voteAverage - a.voteAverage,
      )
      .slice(0, 14);
    if (because.length >= 4) {
      rows.push({
        key: "because",
        title: `Because you watched ${lastWatched.title.name}`,
        items: because,
      });
    }
  }

  const newReleases = [...all]
    .filter((t) => t.newRelease)
    .sort((a, b) => b.year - a.year)
    .slice(0, 20);
  if (newReleases.length >= 4) {
    rows.push({ key: "new", title: "New Releases", items: newReleases });
  }

  const topRated = [...all]
    .filter((t) => t.voteAverage >= 8)
    .sort(byRating)
    .slice(0, 20);
  if (topRated.length >= 4) {
    rows.push({ key: "top-rated", title: "Top Rated", items: topRated });
  }

  const movies = [...all].filter((t) => t.type === "movie").sort(byPopularity);
  if (movies.length >= 4) {
    rows.push({
      key: "movies",
      title: "Movies",
      items: movies.slice(0, 20),
      href: "/browse/movies",
    });
  }

  const series = [...all].filter((t) => t.type === "series").sort(byPopularity);
  if (series.length >= 4) {
    rows.push({
      key: "series",
      title: "TV Shows",
      items: series.slice(0, 20),
      href: "/browse/tv",
    });
  }

  const genreRows = [
    "Action",
    "Comedy",
    "Drama",
    "Sci-Fi",
    "Thriller",
    "Horror",
    "Romance",
    "Crime",
    "Mystery",
    "Adventure",
    "Animation",
    "Fantasy",
  ];

  for (const genre of genreRows) {
    const items = all
      .filter((t) => t.genres.includes(genre))
      .sort(byPopularity)
      .slice(0, 20);
    if (items.length >= 4) {
      rows.push({
        key: `genre-${genre}`,
        title: genre,
        items,
        href: `/browse/genre/${encodeURIComponent(genre)}`,
      });
    }
  }

  return { featured, rows, continueWatching };
}

export async function searchTitles(
  query: string,
  kids = false,
  limit = 40,
): Promise<TitleDTO[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = await getAllTitles(kids);
  const scored = all
    .map((title) => {
      const name = title.name.toLowerCase();
      let score = 0;
      if (name === q) score += 100;
      if (name.startsWith(q)) score += 50;
      if (name.includes(q)) score += 25;
      if (title.genres.some((g) => g.toLowerCase().includes(q))) score += 10;
      if (title.overview.toLowerCase().includes(q)) score += 4;
      if (title.cast.some((c) => c.toLowerCase().includes(q))) score += 6;
      if (title.year.toString() === q) score += 8;
      return { title, score };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || b.title.voteAverage - a.title.voteAverage,
    )
    .slice(0, limit)
    .map((entry) => entry.title);
  return scored;
}

export async function getGenreTitles(
  genre: string,
  kids = false,
): Promise<TitleDTO[]> {
  const all = await getAllTitles(kids);
  const target = genre.toLowerCase();
  return all
    .filter((t) => t.genres.some((g) => g.toLowerCase() === target))
    .sort(byPopularity);
}

export async function getGenreCounts(
  kids = false,
): Promise<{ genre: string; count: number }[]> {
  const all = await getAllTitles(kids);
  const counts = new Map<string, number>();
  for (const title of all) {
    for (const genre of title.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getMoreLikeThis(
  title: TitleDTO,
  kids = false,
  limit = 12,
): Promise<TitleDTO[]> {
  const all = await getAllTitles(kids);
  return all
    .filter((t) => t.id !== title.id)
    .map((t) => {
      const shared = t.genres.filter((g) => title.genres.includes(g)).length;
      return { t, shared };
    })
    .filter((entry) => entry.shared > 0)
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        (b.t.type === title.type ? 1 : 0) -
          (a.t.type === title.type ? 1 : 0) ||
        b.t.voteAverage - a.t.voteAverage,
    )
    .slice(0, limit)
    .map((entry) => entry.t);
}

export function getEpisode(
  title: TitleDTO,
  episodeId: string | null,
): { season: number; episode: number; label: string; videoUrl: string } | null {
  if (!episodeId || !title.seasons) return null;
  const [seasonNumber, episodeNumber] = episodeId.split("-").map(Number);
  const season = title.seasons.find((s) => s.number === seasonNumber);
  const ep = season?.episodes.find((e) => e.episodeNumber === episodeNumber);
  if (!ep) return null;
  return {
    season: seasonNumber,
    episode: episodeNumber,
    label: `S${seasonNumber}:E${episodeNumber} ${ep.name}`,
    videoUrl: ep.videoUrl || title.videoUrl,
  };
}

export function getNextEpisode(
  title: TitleDTO,
  episodeId: string | null,
): { episodeId: string; label: string } | null {
  if (!episodeId || !title.seasons) return null;
  const [seasonNumber, episodeNumber] = episodeId.split("-").map(Number);
  const season = title.seasons.find((s) => s.number === seasonNumber);
  if (!season) return null;
  const index = season.episodes.findIndex(
    (e) => e.episodeNumber === episodeNumber,
  );
  if (index >= 0 && index < season.episodes.length - 1) {
    const next = season.episodes[index + 1];
    return {
      episodeId: `${seasonNumber}-${next.episodeNumber}`,
      label: `S${seasonNumber}:E${next.episodeNumber} ${next.name}`,
    };
  }
  const nextSeason = title.seasons.find((s) => s.number === seasonNumber + 1);
  if (nextSeason?.episodes.length) {
    const next = nextSeason.episodes[0];
    return {
      episodeId: `${nextSeason.number}-${next.episodeNumber}`,
      label: `S${nextSeason.number}:E${next.episodeNumber} ${next.name}`,
    };
  }
  return null;
}
