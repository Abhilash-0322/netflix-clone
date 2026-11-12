import { NextResponse } from "next/server";
import {
  clearedProfileCookie,
  sessionCookie,
  signSession,
  verifyPassword,
} from "@/lib/auth";
import { users } from "@/lib/db";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Please enter your email and password." },
      { status: 400 },
    );
  }

  const col = await users();
  const user = await col.findOne({ email });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 },
    );
  }

  const token = await signSession({
    userId: user._id!.toString(),
    email: user.email,
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie(token));
  response.cookies.set(clearedProfileCookie);
  return response;
}
