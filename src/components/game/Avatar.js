import { UserRound } from "lucide-react";
import GameImage from "./GameImage";

// Student portrait. Falls back to an icon until /images/avatar-{gender}.png exists.
// This is also the swap point for a future 3D avatar.
export default function Avatar({ gender, className = "size-10", ring = "border-cyan" }) {
  const g = gender ?? "male";
  const tone = g === "female" ? "from-gold/40" : "from-blue/40";
  return (
    <GameImage
      src={`/images/avatar-${g}.png`}
      alt=""
      className={`rounded-full border-2 ${ring} ${className}`}
      fallback={
        <div className={`absolute inset-0 grid place-items-center bg-linear-to-b ${tone} to-surface-2`}>
          <UserRound className="size-1/2 text-ink" aria-hidden="true" />
        </div>
      }
    />
  );
}
