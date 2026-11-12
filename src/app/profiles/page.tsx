import type { Metadata } from "next";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth";
import { profiles } from "@/lib/db";
import { ProfilePicker } from "@/components/ProfilePicker";
import type { ProfileDTO } from "@/lib/types";

export const metadata: Metadata = { title: "Profiles" };

export default async function ProfilesPage() {
  const session = await requireUser();
  const col = await profiles();
  const docs = await col
    .find({ userId: new ObjectId(session.userId) })
    .sort({ createdAt: 1 })
    .toArray();

  const list: ProfileDTO[] = docs.map((doc) => ({
    id: doc._id!.toString(),
    name: doc.name,
    avatar: doc.avatar,
    isKids: doc.isKids,
  }));

  return <ProfilePicker initialProfiles={list} />;
}
