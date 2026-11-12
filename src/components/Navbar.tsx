"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Search, X } from "lucide-react";
import type { ProfileDTO } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Home", href: "/browse" },
  { label: "TV Shows", href: "/browse/tv" },
  { label: "Movies", href: "/browse/movies" },
  { label: "New & Popular", href: "/browse/new" },
  { label: "My List", href: "/my-list" },
];

interface Suggestion {
  id: string;
  slug: string;
  name: string;
  year: number;
  type: string;
  poster: string;
  maturity: string;
}

export function Navbar({ profile }: { profile: ProfileDTO }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const solid = scrolled || pathname !== "/browse";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [searchOpen]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 1) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { results: Suggestion[] };
        setSuggestions(data.results);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    router.push(`/search?q=${encodeURIComponent(value)}`);
    setSearchOpen(false);
    setSuggestions([]);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        solid
          ? "bg-[#141414] shadow-lg shadow-black/30"
          : "bg-gradient-to-b from-black/90 via-black/50 to-transparent",
      )}
    >
      <nav className="flex h-14 items-center gap-5 px-4 md:h-[68px] md:gap-7 md:px-12">
        <Logo className="text-2xl md:text-3xl" />

        <ul className="hidden items-center gap-5 text-sm text-neutral-300 md:flex">
          {LINKS.map((link) => {
            const active =
              link.href === "/browse"
                ? pathname === "/browse"
                : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "transition hover:text-white",
                    active && "font-semibold text-white",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-3 md:gap-5">
          <button
            type="button"
            aria-label="Search"
            onClick={() => {
              setSearchOpen((open) => !open);
              setSuggestions([]);
            }}
            className="text-neutral-200 transition hover:text-white"
          >
            {searchOpen ? <X size={21} /> : <Search size={21} />}
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="relative hidden text-neutral-200 transition hover:text-white sm:block"
          >
            <Bell size={21} />
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-nf-red text-[9px] font-bold text-white">
              3
            </span>
          </button>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-1.5"
              aria-label="Profile menu"
            >
              <Avatar
                avatar={profile.avatar}
                className="h-8 w-8 ring-1 ring-white/20"
                emojiClassName="text-lg"
              />
              <ChevronDown
                size={14}
                className={cn(
                  "hidden text-white/80 transition sm:block",
                  profileOpen && "rotate-180",
                )}
              />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-11 w-60 overflow-hidden rounded-md border border-white/10 bg-black/95 py-2 text-sm shadow-2xl backdrop-blur">
                <div className="flex items-center gap-3 px-4 py-2">
                  <Avatar
                    avatar={profile.avatar}
                    className="h-9 w-9"
                    emojiClassName="text-lg"
                  />
                  <div>
                    <p className="font-semibold text-white">{profile.name}</p>
                    {profile.isKids ? (
                      <p className="text-[11px] text-neutral-400">Kids profile</p>
                    ) : null}
                  </div>
                </div>
                <div className="my-1 h-px bg-white/10" />
                <div className="md:hidden">
                  {LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-neutral-300 hover:bg-white/10 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="my-1 h-px bg-white/10" />
                </div>
                <Link
                  href="/profiles"
                  onClick={() => setProfileOpen(false)}
                  className="block px-4 py-2 text-neutral-300 hover:bg-white/10 hover:text-white"
                >
                  Manage Profiles
                </Link>
                <Link
                  href="/account"
                  onClick={() => setProfileOpen(false)}
                  className="block px-4 py-2 text-neutral-300 hover:bg-white/10 hover:text-white"
                >
                  Account
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="block w-full px-4 py-2 text-left text-neutral-300 hover:bg-white/10 hover:text-white"
                >
                  Sign out of Netflix
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      {searchOpen ? (
        <div className="border-t border-white/10 bg-black/95 px-4 py-3 md:px-12">
          <form onSubmit={submitSearch} className="relative mx-auto max-w-3xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search movies, TV shows, genres..."
              className="w-full rounded-md border border-white/20 bg-neutral-900 py-3 pl-10 pr-10 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/50"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            ) : null}
          </form>

          {suggestions.length > 0 ? (
            <div className="mx-auto mt-2 max-w-3xl overflow-hidden rounded-md border border-white/10 bg-neutral-900">
              {suggestions.map((item) => (
                <Link
                  key={item.id}
                  href={`/title/${item.slug}`}
                  onClick={() => {
                    setSearchOpen(false);
                    setQuery("");
                    setSuggestions([]);
                  }}
                  className="flex items-center gap-3 border-b border-white/5 px-3 py-2 last:border-0 hover:bg-white/10"
                >
                  <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-neutral-800">
                    {item.poster ? (
                      <Image
                        src={item.poster}
                        alt={item.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {item.year} · {item.type === "series" ? "Series" : "Film"} ·{" "}
                      {item.maturity}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
