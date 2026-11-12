import { ObjectId } from "mongodb";
import type { Collection } from "mongodb";
import catalogJson from "@/data/catalog.json";
import { FEATURED_SLUGS } from "./constants";
import { getDb, myList, profiles, progress, titles, users } from "./db";
import { hashPassword } from "./password";
import type { Season, TitleDoc } from "./types";

interface RawTitle {
  tmdbId: number;
  type: "movie" | "series" | "tv";
  name: string;
  slug: string;
  overview: string;
  year: number | null;
  genres: string[];
  voteAverage: number;
  voteCount: number;
  runtimeMinutes: number;
  cast: string[];
  poster: string;
  backdrop: string;
  videoUrl: string;
  seasons?: Season[];
}

const GEO_GENRE_MAP: Record<string, string> = {
  "Action & Adventure": "Action",
  "Sci-Fi & Fantasy": "Sci-Fi",
  "Science Fiction": "Sci-Fi",
  TV: "Drama",
  "Kids": "Family",
  "Reality": "Drama",
  "Talk": "Drama",
  "News": "Drama",
  "Soap": "Drama",
};

const GOOD_GENRES = new Set([
  "Animation",
  "Family",
  "Adventure",
  "Fantasy",
  "Comedy",
  "Music",
]);
const BAD_GENRES = new Set(["Horror", "Crime", "Thriller", "War"]);

function normalizeGenres(raw: string[]): string[] {
  const mapped = raw.map((g) => GEO_GENRE_MAP[g] ?? g);
  return [...new Set(mapped)].filter(Boolean);
}

function deriveMaturity(type: string, genres: string[]): string {
  const has = (...values: string[]) => values.some((v) => genres.includes(v));
  if (type === "series") {
    if (has("Horror") || has("Thriller") || has("Crime")) return "TV-MA";
    if (has("Comedy", "Animation", "Fantasy")) return "TV-14";
    return "TV-14";
  }
  if (has("Animation")) return "PG";
  if (has("Horror", "Crime", "Thriller", "War")) return "R";
  if (has("Comedy", "Romance")) return "PG-13";
  return "PG-13";
}

function deriveKidsFriendly(genres: string[], maturity: string): boolean {
  if (genres.some((g) => BAD_GENRES.has(g))) return false;
  const softRatings = ["G", "PG", "TV-Y", "TV-Y7", "TV-G", "TV-PG"];
  return (
    genres.some((g) => GOOD_GENRES.has(g)) || softRatings.includes(maturity)
  );
}

function buildTitleDocs(raw: RawTitle[]): TitleDoc[] {
  const seenSlugs = new Set<string>();
  return raw.map((item) => {
    let slug = item.slug;
    if (seenSlugs.has(slug)) slug = `${slug}-${item.tmdbId}`;
    seenSlugs.add(slug);

    const genres = normalizeGenres(item.genres);
    const type = item.type === "series" || item.type === "tv" ? "series" : "movie";
    const year = item.year ?? (item.seasons?.length ? 2020 : 2015);
    const maturity = deriveMaturity(type, genres);

    return {
      tmdbId: item.tmdbId,
      slug,
      name: item.name,
      type,
      overview: item.overview,
      year,
      genres,
      voteAverage: item.voteAverage || 7,
      voteCount: item.voteCount || 0,
      runtimeMinutes:
        item.runtimeMinutes ||
        (type === "series" ? 45 : year < 2000 ? 120 : 110),
      cast: item.cast ?? [],
      poster: item.poster,
      backdrop: item.backdrop || item.poster,
      videoUrl: item.videoUrl,
      maturity,
      featured: FEATURED_SLUGS.includes(slug),
      trending: item.voteCount > 4000,
      newRelease: year >= 2022,
      kidsFriendly: deriveKidsFriendly(genres, maturity),
      seasons: item.seasons,
      createdAt: new Date(),
    };
  });
}

async function bulkUpsert<T extends { tmdbId?: number; slug?: string }>(
  collection: Collection<T>,
  docs: T[],
  key: keyof T,
) {
  if (!docs.length) return;
  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { [key]: doc[key] } as never,
      update: { $set: doc },
      upsert: true,
    },
  }));
  await collection.bulkWrite(ops as never);
}

export async function createIndexes() {
  const db = await getDb();
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("profiles").createIndex({ userId: 1 }),
    db.collection("titles").createIndex({ slug: 1 }, { unique: true }),
    db.collection("titles").createIndex({ tmdbId: 1 }, { unique: true }),
    db.collection("titles").createIndex({ genres: 1 }),
    db
      .collection("myList")
      .createIndex({ profileId: 1, titleId: 1 }, { unique: true }),
    db.collection("progress").createIndex(
      { profileId: 1, titleId: 1, episodeId: 1 },
      { unique: true },
    ),
    db
      .collection("ratings")
      .createIndex({ profileId: 1, titleId: 1 }, { unique: true }),
  ]);
}

async function seedDemoAccount() {
  const userCol = await users();
  let demo = await userCol.findOne({ email: "demo@netflix.dev" });
  if (!demo) {
    const passwordHash = await hashPassword("demo1234");
    const res = await userCol.insertOne({
      name: "Demo User",
      email: "demo@netflix.dev",
      passwordHash,
      createdAt: new Date(),
    });
    demo = {
      _id: res.insertedId,
      name: "Demo User",
      email: "demo@netflix.dev",
      passwordHash,
      createdAt: new Date(),
    };
  }
  if (!demo._id) return;

  const profileCol = await profiles();
  const existing = await profileCol.find({ userId: demo._id }).toArray();

  let profileId: ObjectId;
  if (existing.length === 0) {
    const res = await profileCol.insertMany([
      {
        userId: demo._id,
        name: "Alex",
        avatar: 0,
        isKids: false,
        createdAt: new Date(),
      },
      {
        userId: demo._id,
        name: "Jordan",
        avatar: 1,
        isKids: false,
        createdAt: new Date(),
      },
      {
        userId: demo._id,
        name: "Kids",
        avatar: 3,
        isKids: true,
        createdAt: new Date(),
      },
    ]);
    profileId = res.insertedIds[0];
  } else {
    profileId = existing[0]._id!;
  }

  const titleCol = await titles();
  const listCol = await myList();
  const progressCol = await progress();

  const myListCount = await listCol.countDocuments({ profileId });
  if (myListCount === 0) {
    const wanted = [
      "stranger-things",
      "inception",
      "dune-part-two",
      "the-batman",
      "money-heist",
      "interstellar",
      "squid-game",
    ];
    const docs = await titleCol.find({ slug: { $in: wanted } }).toArray();
    if (docs.length) {
      await listCol.insertMany(
        docs.map((doc) => ({
          profileId,
          titleId: doc._id!,
          createdAt: new Date(),
        })),
      );
    }
  }

  const progressCount = await progressCol.countDocuments({ profileId });
  if (progressCount === 0) {
    const seeds: { slug: string; episodeId: string | null; position: number }[] =
      [
        { slug: "stranger-things", episodeId: "1-2", position: 12 },
        { slug: "inception", episodeId: null, position: 18 },
        { slug: "the-batman", episodeId: null, position: 9 },
        { slug: "money-heist", episodeId: "1-1", position: 14 },
        { slug: "wednesday", episodeId: "1-1", position: 6 },
        { slug: "interstellar", episodeId: null, position: 21 },
      ];
    const docs = await titleCol
      .find({ slug: { $in: seeds.map((s) => s.slug) } })
      .toArray();
    const now = Date.now();
    const progressDocs = seeds
      .map((seed, index) => {
        const title = docs.find((d) => d.slug === seed.slug);
        if (!title?._id) return null;
        return {
          profileId,
          titleId: title._id,
          episodeId: seed.episodeId,
          position: seed.position,
          duration: 60,
          updatedAt: new Date(now - index * 60 * 60 * 1000),
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
    if (progressDocs.length) await progressCol.insertMany(progressDocs);
  }
}

export async function seedDatabase({ force = false } = {}) {
  if (force) {
    const db = await getDb();
    await Promise.all(
      ["titles", "users", "profiles", "myList", "progress", "ratings"].map(
        (name) => db.collection(name).deleteMany({}),
      ),
    );
  }

  await createIndexes();

  const raw = catalogJson as unknown as RawTitle[];
  const docs = buildTitleDocs(raw);
  await bulkUpsert(await titles(), docs, "tmdbId");
  await seedDemoAccount();

  const count = await (await titles()).countDocuments();
  return { titles: count };
}

let seedPromise: Promise<{ titles: number }> | null = null;

export async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const titleCol = await titles();
      const count = await titleCol.countDocuments();
      if (count > 0) return { titles: count };
      return seedDatabase();
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}
