import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/browse",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Netflix Clone home"
      className={cn(
        "select-none font-black uppercase tracking-tighter text-nf-red transition hover:text-red-500",
        className,
      )}
      style={{ fontFamily: "Arial Black, Arial, sans-serif" }}
    >
      NETFLIX
    </Link>
  );
}
