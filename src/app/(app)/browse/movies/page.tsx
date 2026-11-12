import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getAllTitles } from "@/lib/data";
import { TitleGrid } from "@/components/TitleGrid";
import { GenreChips } from "@/components/GenreChips";

export const metadata: Metadata = { title: "Movies" };

export default async function MoviesPage() {
  const { profile } = await requireProfile();
  const all = await getAllTitles(profile.isKids);
  const movies = all
    .filter((title) => title.type === "movie")
    .sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="px-4 pb-16 pt-24 md:px-12 md:pt-28">
      <h1 className="text-2xl font-bold text-white md:text-3xl">Movies</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-400">
        {movies.length} films ready to stream
      </p>
      <GenreChips />
      <TitleGrid
        items={movies}
        emptyMessage="No movies available for this profile."
      />
    </div>
  );
}
