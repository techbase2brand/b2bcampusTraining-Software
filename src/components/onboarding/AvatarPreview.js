import { UserRound } from "lucide-react";

// Static avatar preview. Swap the body for a GLB/Three.js canvas later; props stay the same.
export default function AvatarPreview({ gender, selected, size = "md" }) {
  const dims = size === "lg" ? "size-32" : "size-24";
  const tone = gender === "female" ? "from-gold/40 to-surface-2" : "from-blue/40 to-surface-2";
  return (
    <div
      data-avatar={gender}
      className={`grid place-items-center rounded-full border-2 bg-linear-to-b ${tone} ${dims} ${
        selected ? "border-cyan-bright shadow-[0_0_24px_rgb(37_217_255/0.4)]" : "border-line"
      }`}
    >
      <UserRound className="size-1/2 text-ink" aria-hidden="true" />
    </div>
  );
}
