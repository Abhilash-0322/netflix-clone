import type { Metadata } from "next";
import { Search } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getAllTitles, searchTitles } from "@/lib/data";
import { TitleGrid } from "@/components/TitleGrid";
import { GenreChips } from "@/components/GenreChips";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { profile } = await requireProfile();
  const params = await searchParams;
  const query = (params.q ?? "").trim();

  const results = query
    ? await searchTitles(query, profile.isKids, 60)
    : [];

  const popular = query
    ? []
    : (await getAllTitles(profile.isKids))
        .sort((a, b) => b.voteAverage - a.voteAverage)
        .slice(0, 18);

  return (
    <div className="px-4 pb-16 pt-24 md:px-12 md:pt-28">
      <form action="/search" className="relative mb-6 max-w-2xl">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search movies, TV shows, genres, cast..."
          className="w-full rounded-md border border-white/20 bg-neutral-900 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/50"
        />
      </form>

      {query ? (
        <>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Results for &ldquo;{query}&rdquo;
          </h1>
          <p className="mb-6 mt-1 text-sm text-neutral-400">
            {results.length} {results.length === 1 ? "title" : "titles"} found
          </p>
          <TitleGrid
            items={results}
            emptyMessage="Your search did not have any matches. Try a different title, genre, or actor."
          />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Search Netflix
          </h1>
          <p className="mb-5 mt-1 text-sm text-neutral-400">
            Find something great to watch. Try a genre below.
          </p>
          <GenreChips />
          <h2 className="mb-4 mt-8 text-lg font-semibold text-white/90">
            Popular on Netflix
          </h2>
          <TitleGrid items={popular} />
        </>
      )}
    </div>
  );
}
