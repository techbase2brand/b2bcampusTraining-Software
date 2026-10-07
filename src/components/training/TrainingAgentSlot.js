import { Bot } from "lucide-react";
import GameImage from "@/components/game/GameImage";

// Training Agent slot. "lg" is the large trainer cutout (/images/trainer-{gender}.png),
// "sm" is a compact badge. A 3D character (Three.js/GLB) can later replace the contents
// of this slot without changing callers.
export default function TrainingAgentSlot({ size = "lg", gender = "male", className = "" }) {
  if (size === "sm") {
    return (
      <div
        data-slot="training-agent"
        className={`grid size-12 shrink-0 place-items-center rounded-full border border-cyan/60 bg-linear-to-b from-surface-2 to-navy-900 shadow-[0_0_24px_rgb(32_199_232/0.25)] ${className}`}
      >
        <Bot className="size-6 text-cyan-bright" aria-label="Training Agent" />
      </div>
    );
  }
  return (
    <div data-slot="training-agent" className={`relative ${className}`}>
      <GameImage
        src={`/images/trainer-${gender}.png`}
        alt="Training Agent"
        fit="contain"
        className="absolute inset-0"
        fallback={
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid size-48 place-items-center rounded-full border border-cyan/60 bg-linear-to-b from-surface-2 to-navy-900 shadow-[0_0_60px_rgb(32_199_232/0.3)]">
              <Bot className="size-24 text-cyan-bright" aria-hidden="true" />
            </div>
          </div>
        }
      />
    </div>
  );
}
