import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getActiveProfile } from "@/lib/auth";
import { ratings, titles } from "@/lib/db";

export async function POST(request: Request) {
  const profile = await getActiveProfile();
  if (!profile) {
    return NextResponse.json({ error: "No active profile" }, { status: 401 });
  }

  let body: { titleId?: string; value?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const titleId = body.titleId ?? "";
  if (!ObjectId.isValid(titleId)) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }

  const value = Number(body.value);
  if (![1, -1, 0].includes(value)) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const titleCol = await titles();
  const title = await titleCol.findOne(
    { _id: new ObjectId(titleId) },
    { projection: { _id: 1 } },
  );
  if (!title) {
    return NextResponse.json({ error: "Title not found" }, { status: 404 });
  }

  const profileId = new ObjectId(profile.id);
  const titleObjectId = new ObjectId(titleId);
  const col = await ratings();

  if (value === 0) {
    await col.deleteOne({ profileId, titleId: titleObjectId });
  } else {
    await col.updateOne(
      { profileId, titleId: titleObjectId },
      {
        $set: {
          profileId,
          titleId: titleObjectId,
          value: value as 1 | -1,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  return NextResponse.json({ value });
}
