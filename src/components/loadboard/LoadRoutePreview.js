import { MapPin, Truck, Flag, Route } from "lucide-react";
import { getTruckContext, evaluatePickup } from "@/lib/loadRules";
import { getLocation } from "@/lib/loadSelectors";
import GameImage from "@/components/game/GameImage";

const pt = (loc) => `${loc.mapPos.x},${loc.mapPos.y}`;

function Marker({ loc, tone, icon: Icon, label }) {
  return (
    <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${loc.mapPos.x}%`, top: `${loc.mapPos.y}%` }}>
      <span className={`grid size-6 place-items-center rounded-full border-2 border-navy-950 shadow-[0_0_12px_currentColor] ${tone}`}>
        <Icon className="size-3 text-navy-950" aria-hidden="true" />
      </span>
      <span className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-navy-950/90 px-1.5 py-0.5 text-[10px] font-semibold text-ink">
        {label}
      </span>
    </div>
  );
}

// Stylized route (image + SVG overlay, replaceable by a real map): truck -> pickup -> delivery.
export default function LoadRoutePreview({ load }) {
  const ctx = getTruckContext();
  const truck = ctx.location;
  const pickup = load ? getLocation(load.originLocationId) : null;
  const delivery = load ? getLocation(load.destinationLocationId) : null;
  const distanceToPickup = load ? evaluatePickup(load, ctx).distanceToPickup : null;

  const stops = [
    { key: "truck", label: "Truck", dot: "bg-blue", loc: truck, extra: null },
    pickup && { key: "pickup", label: "Pickup", dot: "bg-success", loc: pickup, extra: `${distanceToPickup} mi from truck` },
    delivery && { key: "delivery", label: "Delivery", dot: "bg-danger", loc: delivery, extra: `${load.loadedMiles.toLocaleString("en-US")} mi loaded` },
  ].filter(Boolean);

  return (
    <section aria-label="Route preview" className="panel p-3">
      <h2 className="panel-title flex items-center gap-1.5">
        <Route className="size-3.5 text-cyan-bright" aria-hidden="true" /> Route Preview
      </h2>

      <div className="relative mt-2.5 aspect-16/9 overflow-hidden rounded-lg border border-line">
        <GameImage
          src="/images/levelmap-bg.png"
          alt=""
          sizes="22vw"
          className="absolute inset-0"
          fallback={<div className="game-grid absolute inset-0 bg-navy-900" />}
        />
        <div className="absolute inset-0 bg-navy-950/30" />
        {load && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
            <polyline points={`${pt(truck)} ${pt(pickup)}`} fill="none" stroke="#25d9ff" strokeWidth="2" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
            <polyline points={`${pt(pickup)} ${pt(delivery)}`} fill="none" stroke="#25d9ff" strokeWidth="2.6" vectorEffect="non-scaling-stroke" style={{ filter: "drop-shadow(0 0 3px #25d9ff)" }} />
          </svg>
        )}
        {delivery && <Marker loc={delivery} tone="bg-danger text-danger" icon={Flag} label={`${delivery.city}, ${delivery.state}`} />}
        {pickup && pickup.id !== truck.id && <Marker loc={pickup} tone="bg-success text-success" icon={MapPin} label={`${pickup.city}, ${pickup.state}`} />}
        <Marker loc={truck} tone="bg-blue text-blue" icon={Truck} label={`${truck.city}, ${truck.state}`} />
      </div>

      <ol className="relative mt-3 space-y-2 pl-4">
        <span className="absolute bottom-2 left-1 top-2 w-px bg-line" aria-hidden="true" />
        {stops.map((s) => (
          <li key={s.key} className="relative flex items-baseline gap-2 text-xs">
            <span className={`absolute -left-4 top-1 size-2.5 rounded-full ring-2 ring-surface ${s.dot}`} aria-hidden="true" />
            <span className="label-xs w-12 shrink-0">{s.label}</span>
            <span className="font-semibold text-ink">
              {s.loc.city}, {s.loc.state}
            </span>
            {s.extra && <span className="ml-auto whitespace-nowrap text-[11px] text-ink-dim">{s.extra}</span>}
          </li>
        ))}
      </ol>
      {!load && <p className="mt-2 text-[11px] text-ink-dim">Select a load to preview its route.</p>}
    </section>
  );
}
