import { MapPin, Truck, Flag, Route } from "lucide-react";
import { getLocation } from "@/lib/loadSelectors";
import { evaluateDriver } from "@/lib/driverRules";
import GameImage from "@/components/game/GameImage";

const pt = (loc) => `${loc.mapPos.x},${loc.mapPos.y}`;

function Marker({ loc, tone, icon: Icon, label }) {
  return (
    <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${loc.mapPos.x}%`, top: `${loc.mapPos.y}%` }}>
      <span className={`grid size-6 place-items-center rounded-full border-2 border-navy-950 shadow-[0_0_12px_currentColor] ${tone}`}>
        <Icon className="size-3 text-navy-950" aria-hidden="true" />
      </span>
      <span className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-navy-950/90 px-1.5 py-0.5 text-[10px] font-semibold text-ink">{label}</span>
    </div>
  );
}

// Stylized route (image + SVG overlay, replaceable by a real map): driver -> pickup -> delivery,
// with deadhead, loaded and total miles from the driver's own location.
export default function DriverRoutePreview({ load, entry }) {
  const driverLoc = entry ? getLocation(entry.truck.locationId) : null;
  const pickup = getLocation(load.originLocationId);
  const delivery = getLocation(load.destinationLocationId);
  const deadhead = entry ? evaluateDriver(load, entry).deadheadMiles : null;
  const loaded = load.loadedMiles;

  return (
    <section aria-label="Route preview" className="panel p-3">
      <h2 className="panel-title flex items-center gap-1.5">
        <Route className="size-3.5 text-cyan-bright" aria-hidden="true" /> Route Preview
      </h2>

      <div className="relative mt-2.5 aspect-2/1 overflow-hidden rounded-lg border border-line">
        <GameImage src="/images/levelmap-bg.png" alt="" sizes="22vw" className="absolute inset-0" fallback={<div className="game-grid absolute inset-0 bg-navy-900" />} />
        <div className="absolute inset-0 bg-navy-950/30" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
          {driverLoc && <polyline points={`${pt(driverLoc)} ${pt(pickup)}`} fill="none" stroke="#25d9ff" strokeWidth="2" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />}
          <polyline points={`${pt(pickup)} ${pt(delivery)}`} fill="none" stroke="#25d9ff" strokeWidth="2.6" vectorEffect="non-scaling-stroke" style={{ filter: "drop-shadow(0 0 3px #25d9ff)" }} />
        </svg>
        <Marker loc={delivery} tone="bg-danger text-danger" icon={Flag} label={`${delivery.city}, ${delivery.state}`} />
        <Marker loc={pickup} tone="bg-success text-success" icon={MapPin} label={`${pickup.city}, ${pickup.state}`} />
        {driverLoc && driverLoc.id !== pickup.id && <Marker loc={driverLoc} tone="bg-blue text-blue" icon={Truck} label={`${driverLoc.city}, ${driverLoc.state}`} />}
      </div>

      <dl className="mt-2.5 grid grid-cols-3 gap-2 text-center">
        {[
          ["Deadhead", deadhead == null ? "-" : `${deadhead} mi`],
          ["Loaded", `${loaded.toLocaleString("en-US")} mi`],
          ["Total", deadhead == null ? "-" : `${(deadhead + loaded).toLocaleString("en-US")} mi`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-navy-900/70 px-1 py-1.5">
            <dt className="label-xs">{label}</dt>
            <dd className="text-xs font-bold tabular-nums text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {!entry && <p className="mt-2 text-[11px] text-ink-dim">Open a driver to see the deadhead from their location.</p>}
    </section>
  );
}
