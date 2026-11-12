"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { ProfileDTO } from "@/lib/types";
import { PROFILE_AVATARS, MAX_PROFILES } from "@/lib/constants";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; profile: ProfileDTO }
  | null;

export function ProfilePicker({
  initialProfiles,
}: {
  initialProfiles: ProfileDTO[];
}) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileDTO[]>(initialProfiles);
  const [managing, setManaging] = useState(false);
  const [modal, setModal] = useState<ModalState>(
    initialProfiles.length === 0 ? { mode: "create" } : null,
  );
  const [selecting, setSelecting] = useState<string | null>(null);

  function openCreate() {
    setModal({ mode: "create" });
  }

  async function selectProfile(profile: ProfileDTO) {
    if (managing) {
      setModal({ mode: "edit", profile });
      return;
    }
    if (selecting) return;
    setSelecting(profile.id);
    try {
      const res = await fetch("/api/profiles/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id }),
      });
      if (res.ok) {
        router.push("/browse");
        router.refresh();
      } else {
        setSelecting(null);
      }
    } catch {
      setSelecting(null);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#141414]">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span
          className="text-2xl font-black uppercase tracking-tighter text-nf-red md:text-3xl"
          style={{ fontFamily: "Arial Black, Arial, sans-serif" }}
        >
          NETFLIX
        </span>
        <button
          type="button"
          onClick={() => setManaging((value) => !value)}
          className={cn(
            "rounded border px-3 py-1.5 text-xs font-semibold transition md:text-sm",
            managing
              ? "border-white bg-white text-black"
              : "border-white/40 text-neutral-300 hover:border-white hover:text-white",
          )}
        >
          {managing ? "Done" : "Manage Profiles"}
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <h1 className="mb-8 text-center text-3xl font-medium text-white md:mb-12 md:text-5xl">
          {managing ? "Manage Profiles" : "Who's watching?"}
        </h1>

        <div className="flex flex-wrap justify-center gap-4 md:gap-7">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => selectProfile(profile)}
              className="group flex w-24 flex-col items-center gap-2 md:w-36"
            >
              <div className="relative">
                <Avatar
                  avatar={profile.avatar}
                  className={cn(
                    "h-24 w-24 text-4xl ring-2 ring-transparent transition group-hover:ring-white md:h-36 md:w-36 md:text-6xl",
                    selecting === profile.id && "opacity-60",
                  )}
                  emojiClassName="text-4xl md:text-6xl"
                />
                {managing ? (
                  <span className="absolute inset-0 grid place-items-center rounded-md bg-black/60">
                    <Pencil size={26} className="text-white" />
                  </span>
                ) : null}
              </div>
              <span className="line-clamp-1 text-sm text-neutral-400 transition group-hover:text-white md:text-base">
                {profile.name}
              </span>
              {profile.isKids ? (
                <span className="-mt-1 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/60">
                  Kids
                </span>
              ) : null}
            </button>
          ))}

          {profiles.length < MAX_PROFILES ? (
            <button
              type="button"
              onClick={openCreate}
              className="group flex w-24 flex-col items-center gap-2 md:w-36"
            >
              <span className="grid h-24 w-24 place-items-center rounded-md border-2 border-dashed border-white/25 text-neutral-400 transition group-hover:border-white group-hover:text-white md:h-36 md:w-36">
                <Plus size={40} />
              </span>
              <span className="text-sm text-neutral-400 transition group-hover:text-white md:text-base">
                Add Profile
              </span>
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={signOut}
          className="mt-12 rounded border border-white/30 px-5 py-2 text-sm text-neutral-400 transition hover:border-white hover:text-white md:mt-16"
        >
          Sign out of Netflix
        </button>
      </main>

      {modal ? (
        <ProfileModal
          modal={modal}
          onClose={() => setModal(null)}
          onCreated={(profile) => {
            setProfiles((current) => [...current, profile]);
            setModal(null);
          }}
          onUpdated={(profile) => {
            setProfiles((current) =>
              current.map((item) => (item.id === profile.id ? profile : item)),
            );
            setModal(null);
          }}
          onDeleted={(id) => {
            setProfiles((current) => current.filter((item) => item.id !== id));
            setModal(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ProfileModal({
  modal,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}: {
  modal: { mode: "create" } | { mode: "edit"; profile: ProfileDTO };
  onClose: () => void;
  onCreated: (profile: ProfileDTO) => void;
  onUpdated: (profile: ProfileDTO) => void;
  onDeleted: (id: string) => void;
}) {
  const isEdit = modal.mode === "edit";
  const editing = modal.mode === "edit" ? modal.profile : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [avatar, setAvatar] = useState(editing?.avatar ?? 0);
  const [isKids, setIsKids] = useState(editing?.isKids ?? false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter a profile name.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        isEdit ? `/api/profiles/${editing!.id}` : "/api/profiles",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), avatar, isKids }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (isEdit) {
        onUpdated({ ...editing!, name: name.trim(), avatar, isKids });
      } else {
        onCreated(data.profile as ProfileDTO);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!isEdit) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/profiles/${editing!.id}`, {
        method: "DELETE",
      });
      if (res.ok) onDeleted(editing!.id);
      else setError("Could not delete profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#181818] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {isEdit ? "Edit Profile" : "Add Profile"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-400 transition hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={save} className="space-y-5">
          <div>
            <label
              htmlFor="profile-name"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-400"
            >
              Profile name
            </label>
            <input
              id="profile-name"
              ref={inputRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={20}
              placeholder="Name"
              className="w-full rounded-md border border-white/20 bg-neutral-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/60"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Avatar
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PROFILE_AVATARS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setAvatar(index)}
                  aria-label={`Avatar ${index + 1}`}
                  className={cn(
                    "grid h-14 place-items-center rounded-md ring-2 transition",
                    avatar === index
                      ? "ring-white"
                      : "ring-transparent hover:ring-white/40",
                  )}
                  style={{ background: preset.bg }}
                >
                  <span className="text-2xl">{preset.emoji}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
            <input
              type="checkbox"
              checked={isKids}
              onChange={(event) => setIsKids(event.target.checked)}
              className="h-4 w-4 accent-nf-red"
            />
            <span className="text-sm text-white">Kids Profile</span>
            <span className="ml-auto text-[11px] text-neutral-500">
              Only family-friendly titles
            </span>
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex items-center justify-between gap-3 pt-1">
            {isEdit ? (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition",
                  deleteArmed
                    ? "border-red-500 bg-red-600 text-white hover:bg-red-700"
                    : "border-white/20 text-neutral-400 hover:border-red-500 hover:text-red-400",
                )}
              >
                <Trash2 size={14} />
                {deleteArmed ? "Confirm delete" : "Delete"}
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-nf-red px-5 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
