import { NextResponse } from "next/server";
import { hashPassword, sessionCookie, signSession } from "@/lib/auth";
import { users } from "@/lib/db";
import { isEmail } from "@/lib/utils";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 },
    );
  }
  if (!isEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  const col = await users();
  const existing = await col.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const result = await col.insertOne({
    name,
    email,
    passwordHash,
    createdAt: new Date(),
  });

  const token = await signSession({
    userId: result.insertedId.toString(),
    email,
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie(token));
  return response;
}
