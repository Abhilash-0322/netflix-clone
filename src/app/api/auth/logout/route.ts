import { NextResponse } from "next/server";
import { clearedProfileCookie, clearedSessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearedSessionCookie);
  response.cookies.set(clearedProfileCookie);
  return response;
}
