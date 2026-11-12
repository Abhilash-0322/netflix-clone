import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getMyListTitles } from "@/lib/data";
import { TitleGrid } from "@/components/TitleGrid";

export const metadata: Metadata = { title: "My List" };

export default async function MyListPage() {
  const { profile } = await requireProfile();
  const items = await getMyListTitles(profile.id, profile.isKids);

  return (
    <div className="px-4 pb-16 pt-24 md:px-12 md:pt-28">
      <h1 className="text-2xl font-bold text-white md:text-3xl">My List</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-400">
        {items.length} {items.length === 1 ? "title" : "titles"} saved by{" "}
        {profile.name}
      </p>

      {items.length === 0 ? (
        <div className="max-w-lg rounded-xl border border-white/10 bg-neutral-900/70 p-8">
          <h2 className="text-lg font-semibold text-white">
            Your list is empty
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            Add movies and shows to your list by tapping the + button on any
            title. Your list is saved to your profile.
          </p>
          <Link
            href="/browse"
            className="mt-5 inline-flex rounded-md bg-nf-red px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Browse titles
          </Link>
        </div>
      ) : (
        <TitleGrid items={items} />
      )}
    </div>
  );
}
