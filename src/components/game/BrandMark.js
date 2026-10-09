import { Truck } from "lucide-react";

// Wordmark in the style of the mockups. Swap for /images/logo.png when a logo file exists.
export default function BrandMark({ subtitle = false, center = false, size = "md" }) {
  const big = size === "lg";
  return (
    <div className={`flex flex-col ${center ? "items-center" : "items-start"}`}>
      <div className="flex items-center gap-2">
        <Truck className={`${big ? "size-10" : "size-7"} text-cyan-bright`} aria-hidden="true" />
        <div className="leading-none">
          <p className={`font-black tracking-tight text-ink ${big ? "text-4xl" : "text-xl"}`}>B2B</p>
          <p className={`font-semibold tracking-[0.25em] text-ink-dim ${big ? "text-[11px]" : "text-[11px]"}`}>
            LOGISTICS
          </p>
        </div>
      </div>
      {subtitle && (
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">
          Dispatcher Training Simulation
        </p>
      )}
    </div>
  );
}
