import Image from "next/image";
import Link from "next/link";
import {
  Baby,
  Download,
  MonitorPlay,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { readSession } from "@/lib/auth";
import { getAllTitles, getFeaturedTitles } from "@/lib/data";
import { EmailCapture } from "@/components/EmailCapture";

const FAQS = [
  {
    q: "What is this Netflix clone?",
    a: "It is a fully working streaming app built with Next.js, TypeScript, and MongoDB. It includes accounts, profiles, personalized rows, search, My List, ratings, episodic playback, and resume watching.",
  },
  {
    q: "How much does it cost?",
    a: "Nothing. This is an open demo running locally. No payment details are required and no real subscription is created.",
  },
  {
    q: "Where can I watch?",
    a: "Watch on your laptop, desktop, tablet, or phone directly in the browser. The player supports fullscreen, keyboard shortcuts, and remembers your progress.",
  },
  {
    q: "How do profiles work?",
    a: "Each account supports up to five profiles, including kid-friendly profiles. Every profile has its own My List, ratings, and watch history.",
  },
  {
    q: "Is the video content real?",
    a: "Artwork and metadata come from TMDB and TVmaze. Streaming uses public sample clips so the player and progress tracking can be demonstrated safely.",
  },
];

export default async function LandingPage() {
  const [featured, session, all] = await Promise.all([
    getFeaturedTitles(false),
    readSession(),
    getAllTitles(false),
  ]);

  const hero = featured[0] ?? all[0];
  const kidsTitles = all.filter((title) => title.kidsFriendly);
  const kidsTitle = kidsTitles[0] ?? hero;
  const secondary = featured[1] ?? all[1] ?? hero;

  return (
    <div className="bg-black">
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-5 md:px-12 md:py-6">
        <Link
          href="/"
          aria-label="Netflix home"
          className="text-2xl font-black uppercase tracking-tighter text-nf-red md:text-4xl"
          style={{ fontFamily: "Arial Black, Arial, sans-serif" }}
        >
          NETFLIX
        </Link>
        <div className="flex items-center gap-2">
          <select
            aria-label="Language"
            className="hidden rounded border border-white/30 bg-black/40 px-2.5 py-1.5 text-sm text-white sm:block"
            defaultValue="en"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
          <Link
            href={session ? "/browse" : "/login"}
            className="rounded-md bg-nf-red px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            {session ? "Browse" : "Sign In"}
          </Link>
        </div>
      </header>

      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4 pb-16 pt-28 text-center md:min-h-[92vh]">
        {hero ? (
          <>
            <Image
              src={hero.backdrop}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-top opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/65 to-black" />
          </>
        ) : (
          <div className="absolute inset-0 bg-neutral-950" />
        )}

        <div className="relative z-10 mx-auto max-w-4xl">
          <h1 className="text-4xl font-black leading-[1.05] text-white text-shadow-hero sm:text-5xl md:text-6xl">
            Unlimited movies, TV shows, and more
          </h1>
          <p className="mt-4 text-lg font-medium text-white/90 md:text-2xl">
            Starts at $0. Cancel anytime.
          </p>
          <p className="mt-6 text-sm text-white/90 md:text-base">
            Ready to watch? Enter your email to create or restart your
            membership.
          </p>
          <div className="mt-4 flex justify-center">
            <EmailCapture />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </section>

      <div className="h-2 w-full bg-gradient-to-r from-transparent via-nf-red/70 to-transparent" />

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="text-3xl font-black text-white md:text-5xl">
              Enjoy on your TV
            </h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-300 md:text-xl">
              Watch on smart TVs, PlayStation, Xbox, Chromecast, Apple TV,
              Blu-ray players, and more.
            </p>
            <p className="mt-6 flex items-center gap-2 text-sm text-neutral-400">
              <MonitorPlay size={18} className="text-nf-red" /> Adaptive HD
              playback with fullscreen controls
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-xl border-8 border-neutral-800 bg-neutral-900 shadow-2xl shadow-black">
              {hero ? (
                <div className="relative aspect-video">
                  <Image
                    src={hero.backdrop}
                    alt={hero.name}
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <p className="absolute bottom-3 left-4 text-sm font-semibold text-white">
                    {hero.name}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-white/10" />

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="order-2 md:order-1">
            <div className="relative mx-auto w-full max-w-md">
              <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black">
                <Image
                  src={secondary.backdrop}
                  alt={secondary.name}
                  fill
                  sizes="400px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -right-3 w-40 overflow-hidden rounded-lg border-4 border-neutral-800 bg-black shadow-xl sm:-right-6">
                <div className="relative aspect-[2/3]">
                  <Image
                    src={kidsTitle.poster}
                    alt={kidsTitle.name}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <Download size={12} className="text-nf-red" />
                  <span className="text-[10px] text-neutral-300">
                    Downloading...
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-black text-white md:text-5xl">
              Watch everywhere
            </h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-300 md:text-xl">
              Stream unlimited movies and TV shows on your phone, tablet,
              laptop, and TV without paying more.
            </p>
            <p className="mt-6 flex items-center gap-2 text-sm text-neutral-400">
              <Smartphone size={18} className="text-nf-red" /> Resume exactly
              where you left off
            </p>
          </div>
        </div>
      </section>

      <div className="h-px bg-white/10" />

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="text-3xl font-black text-white md:text-5xl">
              Create profiles for kids
            </h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-300 md:text-xl">
              Send children on adventures with their favorite characters in a
              space made just for them — free with your membership.
            </p>
            <p className="mt-6 flex items-center gap-2 text-sm text-neutral-400">
              <Baby size={18} className="text-nf-red" /> Kids profiles only see
              family-friendly titles
            </p>
          </div>
          <div className="relative mx-auto flex w-full max-w-md items-end justify-center gap-3">
            {kidsTitles.slice(0, 3).map((title, index) => (
              <div
                key={title.id}
                className="relative w-1/3 overflow-hidden rounded-lg border border-white/10 shadow-xl shadow-black"
                style={{
                  transform: `translateY(${index === 1 ? -16 : 0}px)`,
                }}
              >
                <div className="relative aspect-[2/3]">
                  <Image
                    src={title.poster}
                    alt={title.name}
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <p className="absolute inset-x-0 bottom-2 px-2 text-center text-[11px] font-semibold text-white">
                    {title.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-white/10" />

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="order-2 md:order-1">
            <div className="relative mx-auto flex w-full max-w-sm items-center gap-4 rounded-xl border border-white/10 bg-neutral-900/80 p-4 shadow-2xl">
              <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-md">
                <Image
                  src={kidsTitle.poster}
                  alt={kidsTitle.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  My List · {all.length} titles
                </p>
                <p className="text-xs text-neutral-400">
                  Saved to your profile
                </p>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-2/3 bg-nf-red" />
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-black text-white md:text-5xl">
              Build your own list
            </h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-300 md:text-xl">
              Add films and series to My List, rate what you love, and pick up
              right where you paused on any device.
            </p>
            <p className="mt-6 flex items-center gap-2 text-sm text-neutral-400">
              <Sparkles size={18} className="text-nf-red" /> Personalized rows
              and recommendations based on your taste
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 md:py-20">
        <h2 className="mb-6 text-center text-2xl font-black text-white md:text-4xl">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group rounded-md bg-neutral-800/80 open:bg-neutral-800"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-base font-medium text-white md:text-xl">
                {item.q}
                <span className="text-2xl font-light text-white/70 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="border-t border-black/40 px-5 py-4 text-sm leading-relaxed text-neutral-300 md:text-base">
                {item.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-neutral-300">
            Ready to watch? Enter your email to create or restart your
            membership.
          </p>
          <EmailCapture compact />
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-12 text-sm text-neutral-500 md:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="mb-6">Questions? Call 000-000-000-0000 (demo)</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              "FAQ",
              "Help Center",
              "Account",
              "Media Center",
              "Investor Relations",
              "Jobs",
              "Privacy",
              "Terms of Use",
              "Contact Us",
              "Ways to Watch",
              "Corporate Information",
              "Only on Netflix",
            ].map((label) => (
              <span key={label} className="hover:text-neutral-300">
                {label}
              </span>
            ))}
          </div>
          <p className="mt-8 text-xs leading-relaxed text-neutral-600">
            Netflix Clone — a Next.js + MongoDB demo project. Artwork and
            metadata provided by TMDB and TVmaze. Not affiliated with Netflix,
            Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
