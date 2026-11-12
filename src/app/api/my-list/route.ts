import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getActiveProfile } from "@/lib/auth";
import { myList, titles } from "@/lib/db";

export async function GET() {
  const profile = await getActiveProfile();
  if (!profile) {
    return NextResponse.json({ error: "No active profile" }, { status: 401 });
  }
  const col = await myList();
  const docs = await col
    .find({ profileId: new ObjectId(profile.id) })
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json({
    titleIds: docs.map((d) => d.titleId.toString()),
  });
}

export async function POST(request: Request) {
  const profile = await getActiveProfile();
  if (!profile) {
    return NextResponse.json({ error: "No active profile" }, { status: 401 });
  }

  let body: { titleId?: string; action?: "add" | "remove" | "toggle" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const titleId = body.titleId ?? "";
  if (!ObjectId.isValid(titleId)) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
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
  const col = await myList();
  const existing = await col.findOne({
    profileId,
    titleId: titleObjectId,
  });

  const action = body.action ?? "toggle";
  let inList: boolean;

  if (action === "add" || (action === "toggle" && !existing)) {
    if (!existing) {
      await col.insertOne({
        profileId,
        titleId: titleObjectId,
        createdAt: new Date(),
      });
    }
    inList = true;
  } else {
    if (existing) {
      await col.deleteOne({ _id: existing._id });
    }
    inList = false;
  }

  return NextResponse.json({ inList });
}
