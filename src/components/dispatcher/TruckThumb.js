import { Truck } from "lucide-react";
import GameImage from "@/components/game/GameImage";

// Truck thumbnail. Uses the login truck photo until per-truck photos exist:
// pass `src` (e.g. "/images/trucks/trk-101.png") to override.
export default function TruckThumb({ src = "/images/login-truck.png", className = "" }) {
  return (
    <GameImage
      src={src}
      alt=""
      position="22% 60%"
      sizes="320px"
      className={`border border-line ${className}`}
      fallback={
        <div className="absolute inset-0 grid place-items-center bg-linear-to-br from-surface-2 to-navy-900">
          <Truck className="size-1/2 text-cyan-bright" aria-hidden="true" />
        </div>
      }
    />
  );
}
