import { MapPin, Truck, Flag, Radio } from "lucide-react";
import GameImage from "@/components/game/GameImage";

const pt = (p) => `${p.x},${p.y}`;

function Marker({ pos, tone, icon: Icon, label, pulse = false }) {
  return (
    <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
      <span className={`relative grid size-7 place-items-center rounded-full border-2 border-navy-950 shadow-[0_0_12px_currentColor] ${tone}`}>
        {pulse && <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-30" />}
        <Icon className="relative size-3.5 text-navy-950" aria-hidden="true" />
      </span>
      <span className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-navy-950/90 px-1.5 py-0.5 text-[11px] font-semibold text-ink">{label}</span>
    </div>
  );
}

// Stylized live map (image + SVG overlay, replaceable by a real map): start -> pickup -> delivery,
// with the truck at its simulated position. Not GPS: positions come from the scripted trip.
export default function LiveMap({ m }) {
  const { tl, snap, load } = m;
  const start = tl.driverLoc.mapPos;
  const pickup = tl.pickupLoc.mapPos;
  const dest = tl.destLoc.mapPos;
  const truck = snap.mapPos;
  const onLoaded = snap.leg === "loaded";
  return (
    <section aria-label="Live map" className="panel overflow-hidden">
      <div className="relative aspect-video min-h-72 w-full">
        <GameImage src="/images/levelmap-bg.png" alt="" sizes="60vw" className="absolute inset-0" fallback={<div className="game-grid absolute inset-0 bg-navy-900" />} />
        <div className="absolute inset-0 bg-navy-950/35" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
          <polyline points={`${pt(start)} ${pt(pickup)}`} fill="none" stroke="#25d9ff" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          <polyline points={`${pt(pickup)} ${pt(dest)}`} fill="none" stroke="#25d9ff" strokeOpacity="0.35" strokeWidth="2.4" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          <polyline points={onLoaded ? `${pt(pickup)} ${pt(truck)}` : `${pt(start)} ${pt(truck)}`} fill="none" stroke="#25d9ff" strokeWidth="3" vectorEffect="non-scaling-stroke" style={{ filter: "drop-shadow(0 0 3px #25d9ff)" }} />
        </svg>
        <Marker pos={dest} tone="bg-danger text-danger" icon={Flag} label={`Delivery · ${tl.destLoc.city}`} />
        <Marker pos={pickup} tone="bg-success text-success" icon={MapPin} label={`Pickup · ${tl.pickupLoc.city}`} />
        <Marker pos={truck} tone="bg-gold-bright text-gold-bright" icon={Truck} label={m.entry.driver.name.split(" ")[0]} pulse />

        <div className="absolute left-2 top-2 z-20 flex items-center gap-2 rounded-lg app-border app-border-subtle bg-navy-950/85 px-2.5 py-1.5 backdrop-blur-sm">
          <Radio className="size-3.5 text-cyan-bright" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-bright">{snap.status}</p>
            <p className="text-[11px] text-ink">{snap.location}</p>
          </div>
        </div>
        <div className="absolute bottom-2 right-2 z-20 rounded-lg app-border bg-navy-950/85 px-2.5 py-1 text-[11px] text-ink-dim">
          {load.referenceNumber} · <span className="font-semibold text-ink">{snap.remainingMiles} mi</span> to delivery · simulated position
        </div>
      </div>
    </section>
  );
}
