"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function AuthForm({
  mode,
  initialEmail = "",
}: {
  mode: "login" | "signup";
  initialEmail?: string;
}) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSignup ? { name, email, password } : { email, password },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/profiles");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function fillDemo() {
    setEmail("demo@netflix.dev");
    setPassword("demo1234");
    setError("");
  }

  return (
    <div className="w-full max-w-md rounded-lg bg-black/75 px-6 py-8 shadow-2xl backdrop-blur-sm sm:px-10 sm:py-10">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">
        {isSignup ? "Create your account" : "Sign In"}
      </h1>
      <p className="mt-1 text-sm text-neutral-400">
        {isSignup
          ? "Unlimited movies, TV shows, and more. Cancel anytime."
          : "Watch anywhere. Cancel anytime."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {isSignup ? (
          <div>
            <label htmlFor="name" className="sr-only">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
              className="w-full rounded-md border border-white/15 bg-neutral-800/80 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/60"
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email or mobile number"
            autoComplete="email"
            required
            className="w-full rounded-md border border-white/15 bg-neutral-800/80 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/60"
          />
        </div>

        <div className="relative">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            className="w-full rounded-md border border-white/15 bg-neutral-800/80 px-4 py-3 pr-11 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/60"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error ? (
          <p className="rounded bg-red-500/15 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-nf-red px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : null}
          {isSignup ? "Sign Up" : "Sign In"}
        </button>
      </form>

      {!isSignup ? (
        <button
          type="button"
          onClick={fillDemo}
          className="mt-3 w-full rounded-md border border-white/15 px-4 py-2.5 text-xs font-semibold text-neutral-300 transition hover:border-white/40 hover:text-white"
        >
          Use demo account (demo@netflix.dev / demo1234)
        </button>
      ) : null}

      <p className="mt-6 text-sm text-neutral-400">
        {isSignup ? "Already have an account? " : "New to Netflix? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-white hover:underline"
        >
          {isSignup ? "Sign in now" : "Sign up now"}
        </Link>
        .
      </p>

      <p className="mt-4 text-xs leading-relaxed text-neutral-500">
        This page is protected by a demo authentication layer. Passwords are
        hashed with bcrypt and sessions are stored in signed httpOnly cookies.
      </p>
    </div>
  );
}
