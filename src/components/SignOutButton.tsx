"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function SignOutButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5 disabled:opacity-60"
      }
    >
      <LogOut size={16} />
      {busy ? "Signing out..." : "Sign Out"}
    </button>
  );
}
