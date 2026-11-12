import { NextResponse } from "next/server";
import { getActiveProfile } from "@/lib/auth";
import { searchTitles } from "@/lib/data";

export async function GET(request: Request) {
  const profile = await getActiveProfile();
  if (!profile) {
    return NextResponse.json({ error: "No active profile" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchTitles(q, profile.isKids, 8);
  return NextResponse.json({
    results: results.map((title) => ({
      id: title.id,
      slug: title.slug,
      name: title.name,
      year: title.year,
      type: title.type,
      poster: title.poster,
      maturity: title.maturity,
    })),
  });
}
