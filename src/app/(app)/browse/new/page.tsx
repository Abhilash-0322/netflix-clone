import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getAllTitles } from "@/lib/data";
import { TitleGrid } from "@/components/TitleGrid";

export const metadata: Metadata = { title: "New & Popular" };

export default async function NewAndPopularPage() {
  const { profile } = await requireProfile();
  const all = await getAllTitles(profile.isKids);
  const recent = all
    .filter((title) => title.newRelease)
    .sort(
      (a, b) => b.year - a.year || b.voteCount - a.voteCount,
    );

  return (
    <div className="px-4 pb-16 pt-24 md:px-12 md:pt-28">
      <h1 className="text-2xl font-bold text-white md:text-3xl">
        New &amp; Popular
      </h1>
      <p className="mb-6 mt-1 text-sm text-neutral-400">
        Fresh releases and fan favorites from the last few years
      </p>
      <TitleGrid
        items={recent}
        emptyMessage="No recent titles available for this profile."
      />
    </div>
  );
}
