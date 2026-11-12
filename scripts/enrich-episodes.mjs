import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const VIDEO_POOL = [
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://vjs.zencdn.net/v/oceans.mp4",
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
  "https://download.samplelib.com/mp4/sample-5s.mp4",
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4",
];

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const catalogPath = path.join(process.cwd(), "src", "data", "catalog.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

let videoIndex = 0;
let matched = 0;

for (const item of catalog) {
  if (item.type !== "tv") continue;
  const q = encodeURIComponent(item.name);
  let payload;
  try {
    const raw = execFileSync(
      "curl",
      [
        "-sL",
        "--max-time",
        "30",
        "-A",
        UA,
        `https://api.tvmaze.com/singlesearch/shows?q=${q}&embed=episodes`,
      ],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    payload = JSON.parse(raw);
  } catch {
    console.warn("TVMaze miss:", item.name);
    continue;
  }
  if (!payload || !payload._embedded?.episodes) {
    console.warn("TVMaze no episodes:", item.name);
    continue;
  }

  const a = norm(item.name);
  const b = norm(payload.name || "");
  if (!(a.includes(b) || b.includes(a))) {
    console.warn(`TVMaze mismatch "${item.name}" -> "${payload.name}"`);
    continue;
  }

  if (!item.year && payload.premiered) {
    item.year = Number(payload.premiered.slice(0, 4)) || item.year;
  }

  const bySeason = new Map();
  for (const ep of payload._embedded.episodes) {
    if (!bySeason.has(ep.season)) bySeason.set(ep.season, []);
    bySeason.get(ep.season).push(ep);
  }

  const seasons = [...bySeason.keys()]
    .sort((x, y) => x - y)
    .filter((n) => n > 0)
    .slice(0, 6)
    .map((seasonNumber) => {
      const eps = bySeason.get(seasonNumber).slice(0, 20);
      return {
        number: seasonNumber,
        name: payload._embedded.seasons?.find((s) => s.number === seasonNumber)
          ?.name ||
          `Season ${seasonNumber}`,
        episodes: eps.map((ep) => ({
          episodeNumber: ep.number,
          name: ep.name || `Episode ${ep.number}`,
          overview: (ep.summary || "").replace(/<[^>]+>/g, "").trim(),
          runtimeMinutes: ep.runtime || 45,
          airDate: ep.airdate || null,
          still: ep.image?.original || null,
          videoUrl: VIDEO_POOL[videoIndex++ % VIDEO_POOL.length],
        })),
      };
    });

  if (seasons.length) {
    item.seasons = seasons;
    item.runtimeMinutes = 45;
    matched++;
    console.log(
      `OK ${item.name} -> ${seasons.length} seasons, ${seasons.reduce((n, s) => n + s.episodes.length, 0)} episodes`,
    );
  }
  await sleep(300);
}

await writeFile(catalogPath, JSON.stringify(catalog, null, 2));
console.log(`\nEnriched ${matched} series in catalog.json`);
