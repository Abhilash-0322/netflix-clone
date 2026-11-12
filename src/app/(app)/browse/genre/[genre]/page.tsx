import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getGenreTitles } from "@/lib/data";
import { TitleGrid } from "@/components/TitleGrid";
import { GenreChips } from "@/components/GenreChips";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}): Promise<Metadata> {
  const { genre } = await params;
  const label = decodeURIComponent(genre);
  return { title: `${label} Movies & Series` };
}

export default async function GenrePage({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { profile } = await requireProfile();
  const { genre } = await params;
  const label = decodeURIComponent(genre);
  const items = await getGenreTitles(label, profile.isKids);

  return (
    <div className="px-4 pb-16 pt-24 md:px-12 md:pt-28">
      <h1 className="text-2xl font-bold text-white md:text-3xl">
        {label} Movies &amp; Series
      </h1>
      <p className="mb-5 mt-1 text-sm text-neutral-400">
        {items.length} titles in {label}
      </p>
      <GenreChips current={label} />
      <TitleGrid
        items={items}
        emptyMessage={`No ${label} titles available for this profile.`}
      />
    </div>
  );
}
