"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmailCapture({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = email.trim();
    router.push(
      value ? `/signup?email=${encodeURIComponent(value)}` : "/signup",
    );
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex w-full flex-col gap-2 sm:flex-row",
        compact ? "max-w-xl" : "max-w-2xl",
      )}
    >
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email address"
        aria-label="Email address"
        className="flex-1 rounded-md border border-white/25 bg-black/60 px-4 py-3 text-sm text-white outline-none backdrop-blur placeholder:text-neutral-400 focus:border-white/70 sm:py-3.5"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-nf-red px-6 py-3 text-base font-bold text-white transition hover:bg-red-700 sm:py-3.5 sm:text-lg"
      >
        Get Started
        <ChevronRight size={22} />
      </button>
    </form>
  );
}
