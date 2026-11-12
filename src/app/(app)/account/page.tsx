import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveProfile, getUserById, readSession } from "@/lib/auth";
import { profiles as profilesCol } from "@/lib/db";
import { ObjectId } from "mongodb";
import { Avatar } from "@/components/Avatar";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  const [user, activeProfile] = await Promise.all([
    getUserById(session.userId),
    getActiveProfile(),
  ]);
  if (!user) redirect("/login");

  const col = await profilesCol();
  const profileDocs = await col
    .find({ userId: new ObjectId(session.userId) })
    .sort({ createdAt: 1 })
    .toArray();

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Today";

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-24 md:px-6 md:pt-32">
      <h1 className="text-2xl font-bold text-white md:text-3xl">
        Account &amp; Settings
      </h1>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-neutral-900/70 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Membership
          </h2>
          <p className="mt-3 text-lg font-semibold text-white">
            {user.name}
          </p>
          <p className="text-sm text-neutral-400">{user.email}</p>
          <div className="mt-4 space-y-1 text-sm text-neutral-300">
            <p>
              <span className="text-neutral-500">Plan:</span> Premium (4K + HDR)
            </p>
            <p>
              <span className="text-neutral-500">Member since:</span>{" "}
              {memberSince}
            </p>
            <p>
              <span className="text-neutral-500">Profiles:</span>{" "}
              {profileDocs.length} of 5
            </p>
          </div>
          <div className="mt-5">
            <SignOutButton />
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-neutral-900/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Profiles
            </h2>
            <Link
              href="/profiles"
              className="text-xs font-semibold text-white underline-offset-2 hover:underline"
            >
              Manage
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {profileDocs.map((profile) => (
              <li
                key={profile._id!.toString()}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/30 px-3 py-2"
              >
                <Avatar
                  avatar={profile.avatar}
                  className="h-9 w-9"
                  emojiClassName="text-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {profile.name}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {profile.isKids ? "Kids profile" : "Standard profile"}
                    {activeProfile?.id === profile._id!.toString()
                      ? " · Active"
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/profiles"
            className="mt-4 inline-flex rounded-md border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
          >
            Switch or edit profiles
          </Link>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-white/10 bg-neutral-900/70 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
          About this demo
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          This is a full-stack Netflix clone powered by Next.js, MongoDB, and
          cookie-based JWT sessions. It supports accounts, up to five profiles
          per account, kids profiles, personalized rows, search, My List,
          ratings, episodic playback, and resume-watching — all persisted to
          MongoDB.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Artwork and metadata are provided by TMDB and TVmaze. Streaming sample
          clips are public test videos.
        </p>
      </section>
    </div>
  );
}
