import { PROFILE_AVATARS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Avatar({
  avatar,
  className,
  emojiClassName,
}: {
  avatar: number;
  className?: string;
  emojiClassName?: string;
}) {
  const preset = PROFILE_AVATARS[avatar % PROFILE_AVATARS.length];
  return (
    <div
      className={cn(
        "grid place-items-center overflow-hidden rounded-md",
        className,
      )}
      style={{ background: preset.bg }}
    >
      <span className={cn("leading-none", emojiClassName)}>{preset.emoji}</span>
    </div>
  );
}
