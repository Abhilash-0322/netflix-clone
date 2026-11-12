import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#141414] px-4 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.4em] text-nf-red">
        Netflix Clone
      </p>
      <h1 className="mt-4 text-3xl font-black text-white md:text-5xl">
        Lost your way?
      </h1>
      <p className="mt-3 max-w-md text-sm text-neutral-400 md:text-base">
        Sorry, we can&apos;t find that page. You&apos;ll find lots to explore on
        the home page.
      </p>
      <Link
        href="/browse"
        className="mt-8 rounded-md bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/80"
      >
        Netflix Home
      </Link>
      <p className="mt-10 text-5xl font-black text-white/10 md:text-7xl">
        ERROR 404
      </p>
    </div>
  );
}
