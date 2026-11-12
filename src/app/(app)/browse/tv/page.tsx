import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getAllTitles } from "@/lib/data";
import { TitleGrid } from "@/components/TitleGrid";
import { GenreChips } from "@/components/GenreChips";

export const metadata: Metadata = { title: "TV Shows" };

export default async function TvShowsPage() {
  const { profile } = await requireProfile();
  const all = await getAllTitles(profile.isKids);
  const series = all
    .filter((title) => title.type === "series")
    .sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="px-4 pb-16 pt-24 md:px-12 md:pt-28">
      <h1 className="text-2xl font-bold text-white md:text-3xl">TV Shows</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-400">
        {series.length} series with episodes to binge
      </p>
      <GenreChips />
      <TitleGrid
        items={series}
        emptyMessage="No shows available for this profile."
      />
    </div>
  );
}
