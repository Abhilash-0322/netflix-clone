import Image from "next/image";
import Link from "next/link";
import { getLandingFeatured } from "@/lib/data";

export async function AuthShell({ children }: { children: React.ReactNode }) {
  const featured = await getLandingFeatured();

  return (
    <div className="relative min-h-screen">
      {featured ? (
        <Image
          src={featured.backdrop}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-950" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-6 py-5 md:px-12 md:py-6">
          <Link
            href="/"
            aria-label="Netflix Clone home"
            className="text-3xl font-black uppercase tracking-tighter text-nf-red md:text-4xl"
            style={{ fontFamily: "Arial Black, Arial, sans-serif" }}
          >
            NETFLIX
          </Link>
        </header>
        <main className="flex flex-1 items-start justify-center px-4 pb-20 pt-4 sm:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
