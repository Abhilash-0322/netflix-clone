import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getActiveProfile } from "@/lib/auth";
import { progress, titles } from "@/lib/db";

export async function POST(request: Request) {
  const profile = await getActiveProfile();
  if (!profile) {
    return NextResponse.json({ error: "No active profile" }, { status: 401 });
  }

  let body: {
    titleId?: string;
    episodeId?: string | null;
    position?: number;
    duration?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const titleId = body.titleId ?? "";
  if (!ObjectId.isValid(titleId)) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }

  const position = Math.max(0, Number(body.position) || 0);
  const duration = Math.max(0, Number(body.duration) || 0);
  if (duration <= 0) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  const titleCol = await titles();
  const title = await titleCol.findOne(
    { _id: new ObjectId(titleId) },
    { projection: { _id: 1 } },
  );
  if (!title) {
    return NextResponse.json({ error: "Title not found" }, { status: 404 });
  }

  const episodeId =
    typeof body.episodeId === "string" && body.episodeId.length > 0
      ? body.episodeId
      : null;

  const col = await progress();
  await col.updateOne(
    {
      profileId: new ObjectId(profile.id),
      titleId: new ObjectId(titleId),
      episodeId,
    },
    {
      $set: {
        profileId: new ObjectId(profile.id),
        titleId: new ObjectId(titleId),
        episodeId,
        position: Math.min(position, duration),
        duration,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}
