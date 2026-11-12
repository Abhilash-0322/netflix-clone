"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

interface PlayerProps {
  titleId: string;
  titleName: string;
  titleSlug: string;
  videoUrl: string;
  poster: string;
  startAt: number;
  episodeId: string | null;
  episodeLabel: string | null;
  nextEpisode: { episodeId: string; label: string } | null;
  backHref: string;
  maturity: string;
  year: number;
}

export function Player({
  titleId,
  titleName,
  titleSlug,
  videoUrl,
  poster,
  startAt,
  episodeId,
  episodeLabel,
  nextEpisode,
  backHref,
  maturity,
  year,
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [ended, setEnded] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const save = useCallback(
    (beacon = false) => {
      const video = videoRef.current;
      if (!video || !video.duration || video.currentTime < 1) return;
      const payload = {
        titleId,
        episodeId,
        position: video.currentTime,
        duration: video.duration,
      };
      const body = JSON.stringify(payload);
      if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/progress",
          new Blob([body], { type: "application/json" }),
        );
        return;
      }
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    },
    [titleId, episodeId],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onBeforeUnload() {
      save(true);
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") save(true);
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
      save(true);
    };
  }, [save]);

  useEffect(() => {
    function onFullscreen() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const video = videoRef.current;
      if (video && !video.paused) setControlsVisible(false);
    }, 3200);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (ended) {
      video.currentTime = 0;
      setEnded(false);
    }
    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
    showControls();
  }, [ended, showControls]);

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(
        0,
        Math.min(video.duration || 0, video.currentTime + delta),
      );
      showControls();
    },
    [showControls],
  );

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      switch (event.key) {
        case " ":
        case "k":
          event.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          event.preventDefault();
          seekBy(10);
          break;
        case "ArrowLeft":
          event.preventDefault();
          seekBy(-10);
          break;
        case "m":
          setMuted((m) => {
            const next = !m;
            if (videoRef.current) videoRef.current.muted = next;
            return next;
          });
          break;
        case "f":
          void toggleFullscreen();
          break;
        case "Escape":
          if (document.fullscreenElement) void document.exitFullscreen();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seekBy, toggleFullscreen]);

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
    setBuffering(false);
    if (startAt > 1 && startAt < (video.duration || 0) - 3) {
      video.currentTime = startAt;
    }
    void video.play().catch(() => setPlaying(false));
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    setCurrent(video.currentTime);
    const now = Date.now();
    if (playing && now - lastSaved.current > 7000) {
      lastSaved.current = now;
      save();
    }
  }

  const progressPercent = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={showControls}
      onMouseLeave={() => {
        if (playing) setControlsVisible(false);
      }}
      className="relative h-screen w-screen overflow-hidden bg-black"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        playsInline
        autoPlay
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => {
          setPlaying(true);
          setEnded(false);
          showControls();
        }}
        onPause={() => {
          setPlaying(false);
          setControlsVisible(true);
          save();
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onEnded={() => {
          setEnded(true);
          setPlaying(false);
          setControlsVisible(true);
          save();
        }}
        onClick={togglePlay}
        className="h-full w-full object-contain"
      />

      {buffering && !ended ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader2 size={56} className="animate-spin text-white/80" />
        </div>
      ) : null}

      {!playing && !ended && !buffering ? (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 grid place-items-center bg-black/20"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80">
            <Play size={40} fill="currentColor" className="ml-1" />
          </span>
        </button>
      ) : null}

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/90 to-transparent transition-opacity duration-300",
          controlsVisible ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-10 flex items-center gap-4 p-4 transition-opacity duration-300 md:p-6",
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <Link
          href={backHref}
          aria-label="Back to details"
          className="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white transition hover:bg-black/70"
        >
          <ArrowLeft size={22} />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white md:text-lg">
            {titleName}
          </p>
          {episodeLabel ? (
            <p className="truncate text-xs text-white/70 md:text-sm">
              {episodeLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/95 via-black/50 to-transparent transition-opacity duration-300",
          controlsVisible ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 px-4 pb-5 transition-opacity duration-300 md:px-8 md:pb-6",
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="mb-1 flex items-center gap-3">
          <span className="w-12 text-right text-[11px] tabular-nums text-white/80 md:text-xs">
            {formatTime(current)}
          </span>
          <div className="relative flex-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-nf-red transition-[width] duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={current}
              onChange={(event) => {
                const video = videoRef.current;
                if (video) video.currentTime = Number(event.target.value);
                setCurrent(Number(event.target.value));
                showControls();
              }}
              aria-label="Seek"
              className="absolute inset-0 h-1 w-full cursor-pointer opacity-0"
            />
            <div
              className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-nf-red opacity-0 transition-opacity"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>
          <span className="w-12 text-[11px] tabular-nums text-white/80 md:text-xs">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-white md:gap-4">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="transition hover:text-white/80"
          >
            {playing ? (
              <Pause size={26} fill="currentColor" />
            ) : (
              <Play size={26} fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            onClick={() => seekBy(-10)}
            aria-label="Rewind 10 seconds"
            className="transition hover:text-white/80"
          >
            <RotateCcw size={22} />
          </button>
          <button
            type="button"
            onClick={() => seekBy(10)}
            aria-label="Forward 10 seconds"
            className="transition hover:text-white/80"
          >
            <RotateCw size={22} />
          </button>

          <div className="group/vol flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !muted;
                setMuted(next);
                if (videoRef.current) videoRef.current.muted = next;
                showControls();
              }}
              aria-label={muted ? "Unmute" : "Mute"}
              className="transition hover:text-white/80"
            >
              {muted || volume === 0 ? (
                <VolumeX size={22} />
              ) : (
                <Volume2 size={22} />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(event) => {
                const value = Number(event.target.value);
                setVolume(value);
                setMuted(value === 0);
                if (videoRef.current) {
                  videoRef.current.volume = value;
                  videoRef.current.muted = value === 0;
                }
                showControls();
              }}
              aria-label="Volume"
              className="h-1 w-16 cursor-pointer accent-white md:w-24"
            />
          </div>

          <div className="ml-auto flex items-center gap-3 md:gap-4">
            <span className="hidden rounded border border-white/40 px-1.5 py-0.5 text-[10px] font-semibold text-white/80 sm:inline">
              {maturity}
            </span>
            <span className="hidden text-xs text-white/60 sm:inline">
              {year} · HD
            </span>
            {nextEpisode ? (
              <Link
                href={`/watch/${titleSlug}?episode=${nextEpisode.episodeId}`}
                aria-label="Next episode"
                className="flex items-center gap-1 text-xs font-semibold text-white/90 transition hover:text-white"
              >
                <SkipForward size={20} />
                <span className="hidden sm:inline">Next</span>
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-label="Toggle fullscreen"
              className="transition hover:text-white/80"
            >
              {fullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
            </button>
          </div>
        </div>
      </div>

      {ended ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/80 p-6">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-neutral-900 p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-nf-red">
              You finished
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">{titleName}</h2>
            {episodeLabel ? (
              <p className="mt-1 text-sm text-neutral-400">{episodeLabel}</p>
            ) : null}
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  const video = videoRef.current;
                  if (video) {
                    video.currentTime = 0;
                    void video.play().catch(() => {});
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/80"
              >
                <Play size={18} fill="currentColor" /> Play Again
              </button>
              {nextEpisode ? (
                <Link
                  href={`/watch/${titleSlug}?episode=${nextEpisode.episodeId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-nf-red px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  <SkipForward size={18} /> Next Episode
                </Link>
              ) : null}
              <Link
                href={backHref}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/30 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-white/60"
              >
                More Details
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
