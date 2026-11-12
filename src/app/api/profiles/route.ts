import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { readSession } from "@/lib/auth";
import { profiles } from "@/lib/db";
import { MAX_PROFILES } from "@/lib/constants";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const col = await profiles();
  const docs = await col
    .find({ userId: new ObjectId(session.userId) })
    .sort({ createdAt: 1 })
    .toArray();
  return NextResponse.json({
    profiles: docs.map((doc) => ({
      id: doc._id!.toString(),
      name: doc.name,
      avatar: doc.avatar,
      isKids: doc.isKids,
    })),
  });
}

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { name?: string; avatar?: number; isKids?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const avatar = Number.isInteger(body.avatar) ? Number(body.avatar) : 0;
  const isKids = Boolean(body.isKids);

  if (name.length < 1 || name.length > 20) {
    return NextResponse.json(
      { error: "Profile name must be 1-20 characters." },
      { status: 400 },
    );
  }

  const userId = new ObjectId(session.userId);
  const col = await profiles();
  const count = await col.countDocuments({ userId });
  if (count >= MAX_PROFILES) {
    return NextResponse.json(
      { error: `You can have up to ${MAX_PROFILES} profiles.` },
      { status: 400 },
    );
  }

  const result = await col.insertOne({
    userId,
    name,
    avatar: Math.max(0, Math.min(7, avatar)),
    isKids,
    createdAt: new Date(),
  });

  return NextResponse.json({
    profile: {
      id: result.insertedId.toString(),
      name,
      avatar: Math.max(0, Math.min(7, avatar)),
      isKids,
    },
  });
}
