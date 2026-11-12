import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  clearedProfileCookie,
  getActiveProfile,
  readSession,
} from "@/lib/auth";
import { getDb, profiles } from "@/lib/db";

async function ownedProfile(profileId: string, userId: string) {
  if (!ObjectId.isValid(profileId) || !ObjectId.isValid(userId)) return null;
  const col = await profiles();
  const doc = await col.findOne({ _id: new ObjectId(profileId) });
  if (!doc || doc.userId.toString() !== userId) return null;
  return doc;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const doc = await ownedProfile(id, session.userId);
  if (!doc) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let body: { name?: string; avatar?: number; isKids?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 1 || name.length > 20) {
      return NextResponse.json(
        { error: "Profile name must be 1-20 characters." },
        { status: 400 },
      );
    }
    update.name = name;
  }
  if (Number.isInteger(body.avatar)) {
    update.avatar = Math.max(0, Math.min(7, Number(body.avatar)));
  }
  if (typeof body.isKids === "boolean") {
    update.isKids = body.isKids;
  }

  if (Object.keys(update).length) {
    const col = await profiles();
    await col.updateOne({ _id: doc._id }, { $set: update });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const doc = await ownedProfile(id, session.userId);
  if (!doc) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const active = await getActiveProfile();
  const db = await getDb();
  await Promise.all([
    db.collection("profiles").deleteOne({ _id: doc._id }),
    db.collection("myList").deleteMany({ profileId: doc._id }),
    db.collection("progress").deleteMany({ profileId: doc._id }),
    db.collection("ratings").deleteMany({ profileId: doc._id }),
  ]);

  const response = NextResponse.json({ ok: true });
  if (active?.id === id) {
    response.cookies.set(clearedProfileCookie);
  }
  return response;
}
