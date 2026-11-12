import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { ObjectId } from "mongodb";
import { profiles, users } from "./db";
export { hashPassword, verifyPassword } from "./password";

import type {
  ProfileDTO,
  ProfileSessionPayload,
  SessionPayload,
} from "./types";

export const SESSION_COOKIE = "nf_session";
export const PROFILE_COOKIE = "nf_profile";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function secretKey() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "netflix-clone-development-secret-change-me",
  );
}

async function sign(
  payload: Record<string, unknown>,
  expires: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secretKey());
}

export function signSession(payload: SessionPayload): Promise<string> {
  return sign({ ...payload, kind: "session" }, "30d");
}

export function signProfile(payload: ProfileSessionPayload): Promise<string> {
  return sign({ ...payload, kind: "profile" }, "30d");
}

async function decode<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as T;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  const payload = await decode<SessionPayload & { kind?: string }>(raw);
  if (!payload || payload.kind !== "session" || !payload.userId) return null;
  return { userId: payload.userId, email: payload.email };
}

export async function getActiveProfile(): Promise<ProfileDTO | null> {
  const store = await cookies();
  const raw = store.get(PROFILE_COOKIE)?.value;
  const payload = await decode<ProfileSessionPayload & { kind?: string }>(raw);
  if (!payload || payload.kind !== "profile" || !payload.profileId) return null;

  const session = await readSession();
  if (!session || session.userId !== payload.userId) return null;
  if (!ObjectId.isValid(payload.profileId)) return null;

  const col = await profiles();
  const profile = await col.findOne({ _id: new ObjectId(payload.profileId) });
  if (!profile || profile.userId.toString() !== session.userId) return null;

  return {
    id: profile._id!.toString(),
    name: profile.name,
    avatar: profile.avatar,
    isKids: profile.isKids,
  };
}

export async function requireUser(): Promise<SessionPayload> {
  const session = await readSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireProfile(): Promise<{
  session: SessionPayload;
  profile: ProfileDTO;
}> {
  const session = await readSession();
  if (!session) redirect("/login");
  const profile = await getActiveProfile();
  if (!profile) redirect("/profiles");
  return { session, profile };
}

export async function getUserById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const col = await users();
  return col.findOne({ _id: new ObjectId(id) });
}

export function sessionCookie(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function profileCookie(token: string) {
  return {
    name: PROFILE_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export const clearedSessionCookie = {
  name: SESSION_COOKIE,
  value: "",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 0,
};

export const clearedProfileCookie = {
  name: PROFILE_COOKIE,
  value: "",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 0,
};
