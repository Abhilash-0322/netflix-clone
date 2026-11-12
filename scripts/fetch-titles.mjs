import { writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const CATALOG = [
  ["movie", 27205], // Inception
  ["movie", 155], // The Dark Knight
  ["movie", 157336], // Interstellar
  ["movie", 603], // The Matrix
  ["movie", 278], // The Shawshank Redemption
  ["movie", 680], // Pulp Fiction
  ["movie", 238], // The Godfather
  ["movie", 550], // Fight Club
  ["movie", 13], // Forrest Gump
  ["movie", 120], // LOTR Fellowship
  ["movie", 98], // Gladiator
  ["movie", 19995], // Avatar
  ["movie", 299534], // Avengers Endgame
  ["movie", 324857], // Into the Spider-Verse
  ["movie", 438631], // Dune
  ["movie", 693134], // Dune Part Two
  ["movie", 872585], // Oppenheimer
  ["movie", 346698], // Barbie
  ["movie", 545611], // Everything Everywhere
  ["movie", 496243], // Parasite
  ["movie", 475557], // Joker
  ["movie", 244786], // Whiplash
  ["movie", 76341], // Mad Max Fury Road
  ["movie", 120467], // Grand Budapest Hotel
  ["movie", 419430], // Get Out
  ["movie", 447332], // A Quiet Place
  ["movie", 138843], // The Conjuring
  ["movie", 313369], // La La Land
  ["movie", 11036], // The Notebook
  ["movie", 4951], // 10 Things I Hate About You
  ["movie", 546554], // Knives Out
  ["movie", 210577], // Gone Girl
  ["movie", 807], // Se7en
  ["movie", 274], // Silence of the Lambs
  ["movie", 329865], // Arrival
  ["movie", 335984], // Blade Runner 2049
  ["movie", 414906], // The Batman
  ["movie", 361743], // Top Gun Maverick
  ["movie", 76600], // Avatar Way of Water
  ["movie", 634649], // No Way Home
  ["tv", 66732], // Stranger Things
  ["tv", 1396], // Breaking Bad
  ["tv", 1399], // Game of Thrones
  ["tv", 71912], // The Witcher
  ["tv", 119051], // Wednesday
  ["tv", 65494], // The Crown
  ["tv", 71446], // Money Heist
  ["tv", 93405], // Squid Game
  ["tv", 87739], // Queen's Gambit
  ["tv", 70523], // Dark
  ["tv", 42009], // Black Mirror
  ["tv", 63351], // Narcos
  ["tv", 2316], // The Office
  ["tv", 48891], // Brooklyn Nine-Nine
  ["tv", 1668], // Friends
  ["tv", 60059], // Better Call Saul
  ["tv", 60574], // Peaky Blinders
  ["tv", 100088], // The Last of Us
  ["tv", 94997], // House of the Dragon
  ["tv", 96677], // Lupin
  ["tv", 91239], // Bridgerton
  ["tv", 69740], // Ozark
  ["tv", 67744], // Mindhunter
  ["tv", 81356], // Sex Education
  ["tv", 75006], // Umbrella Academy
];

const VIDEO_POOL = [
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://vjs.zencdn.net/v/oceans.mp4",
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
  "https://download.samplelib.com/mp4/sample-5s.mp4",
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4",
];

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseJsonLd(html) {
  const m = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function uniqueImages(html, sizeHint) {
  const re = /https:\/\/media\.themoviedb\.org\/t\/p\/([a-z0-9_]+)\/([A-Za-z0-9]+\.(?:jpg|png))/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    if (!sizeHint || m[1].includes(sizeHint)) out.push(m[2]);
  }
  return [...new Set(out)];
}

function parseRuntime(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return (parseInt(m[1] || "0", 10) * 60 + parseInt(m[2] || "0", 10)) || 0;
}

async function fetchOne(type, id, index) {
  const url = `https://www.themoviedb.org/${type}/${id}?language=en-US`;
  let html;
  try {
    html = execFileSync(
      "curl",
      [
        "-sL",
        "--max-time",
        "30",
        "-A",
        UA,
        "-H",
        "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "-H",
        "Accept-Language: en-US,en;q=0.9",
        url,
      ],
      { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
    );
  } catch {
    return { error: `${type}/${id} -> curl failed` };
  }
  if (!html || html.length < 1000) return { error: `${type}/${id} -> blocked` };
  const data = parseJsonLd(html);
  if (!data) return { error: `${type}/${id} -> no jsonld` };

  const name = data.name?.trim();
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const pageTitle = titleMatch?.[1]?.replace(/&#8212;.*$/, "").trim();

  const posterCandidates = uniqueImages(html, "w500");
  const poster =
    posterCandidates[0] ??
    (data.image ? data.image.split("/").pop() : null);

  const backdropCandidates = uniqueImages(html, "w1920");
  const backdrop =
    backdropCandidates[0] ?? uniqueImages(html, "w1066")[0] ?? poster;

  const year = (data.datePublished || data.releasedEvent?.[0]?.startDate || "")
    .slice(0, 4);

  return {
    tmdbId: id,
    type,
    name: name || pageTitle,
    pageTitle,
    slug: slugify(name || pageTitle || `${type}-${id}`),
    overview: data.description || "",
    year: Number(year) || null,
    genres: Array.isArray(data.genre) ? data.genre : [],
    voteAverage: Number(data.aggregateRating?.ratingValue) || 0,
    voteCount: Number(data.aggregateRating?.ratingCount) || 0,
    runtimeMinutes: parseRuntime(data.duration),
    cast: (data.actor || []).slice(0, 8).map((a) => a.name),
    poster,
    backdrop,
    videoUrl: VIDEO_POOL[index % VIDEO_POOL.length],
  };
}

const results = [];
for (let i = 0; i < CATALOG.length; i++) {
  const [type, id] = CATALOG[i];
  try {
    const item = await fetchOne(type, id, i);
    if (item.error) {
      console.error("SKIP", item.error);
    } else {
      results.push(item);
      console.log(
        `OK ${String(i).padStart(2)} ${type} ${item.name} (${item.year}) [${item.genres.join(", ")}]`,
      );
    }
  } catch (e) {
    console.error("ERR", type, id, e.message);
  }
  await sleep(250);
}

const outDir = path.join(process.cwd(), "src", "data");
await mkdir(outDir, { recursive: true });
await writeFile(
  path.join(outDir, "catalog.json"),
  JSON.stringify(results, null, 2),
);
console.log(`\nWrote ${results.length} titles to src/data/catalog.json`);

const missing = results.filter((r) => !r.poster || !r.backdrop);
console.log("Missing art:", missing.map((m) => `${m.type}/${m.tmdbId}`));
