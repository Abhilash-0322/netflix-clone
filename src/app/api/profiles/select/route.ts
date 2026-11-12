import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { profileCookie, readSession, signProfile } from "@/lib/auth";
import { profiles } from "@/lib/db";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { profileId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const profileId = body.profileId ?? "";
  if (!ObjectId.isValid(profileId)) {
    return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
  }

  const col = await profiles();
  const profile = await col.findOne({ _id: new ObjectId(profileId) });
  if (!profile || profile.userId.toString() !== session.userId) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const token = await signProfile({
    profileId: profile._id!.toString(),
    userId: session.userId,
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(profileCookie(token));
  return response;
}
