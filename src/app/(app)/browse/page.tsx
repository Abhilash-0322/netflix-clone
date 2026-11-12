import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getBrowseData } from "@/lib/data";
import { Billboard } from "@/components/Billboard";
import { Row } from "@/components/Row";
import type { RowItem } from "@/lib/types";

export const metadata: Metadata = { title: "Home" };

export default async function BrowsePage() {
  const { profile } = await requireProfile();
  const { featured, rows, continueWatching } = await getBrowseData(
    profile.id,
    profile.isKids,
  );

  const continueItems: RowItem[] = continueWatching.map((item) => ({
    title: item.title,
    progress: item.progress,
    episodeId: item.progress.episodeId,
    episodeLabel: item.episodeLabel,
  }));

  return (
    <>
      <Billboard titles={featured} />

      <div className="relative z-20 -mt-24 space-y-8 pb-16 md:-mt-40 md:space-y-10">
        {continueItems.length > 0 ? (
          <Row
            title={`Continue Watching for ${profile.name}`}
            items={continueItems}
          />
        ) : null}

        {rows.map((row) => (
          <Row
            key={row.key}
            title={row.title}
            items={row.items.map((title) => ({ title }))}
            href={row.href}
            ranked={row.ranked}
          />
        ))}

        {profile.isKids ? (
          <div className="px-4 pt-4 md:px-12">
            <p className="text-xs text-neutral-500">
              Showing kid-friendly titles for the {profile.name} profile.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
