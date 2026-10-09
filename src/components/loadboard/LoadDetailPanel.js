import { FileSearch, Star, MapPin, Flag, Container, Scale, Package, Route, CalendarClock, ClipboardList } from "lucide-react";
import { getBroker, formatLocation } from "@/lib/loadSelectors";
import { formatCurrency, formatSimDay, formatSimClock } from "@/lib/text";
import { phase3Page } from "@/data/phase3Missions";

function Fact({ icon: Icon, label, children, sub }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-cyan-bright/80" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="label-xs">{label}</dt>
        <dd className="truncate text-[13px] font-semibold text-ink">{children}</dd>
        {sub && <dd className="truncate text-[11px] text-ink-dim">{sub}</dd>}
      </div>
    </div>
  );
}

// Selected load facts (Phase 3 information only: no scores, profit or recommendation).
export default function LoadDetailPanel({ load }) {
  if (!load) {
    return (
      <section aria-label="Selected load details" className="panel p-3">
        <h2 className="panel-title">Selected Load Details</h2>
        <div className="mt-3 grid place-items-center rounded-lg app-border border-dashed px-4 py-7 text-center">
          <FileSearch className="size-7 text-ink-dim" aria-hidden="true" />
          <p className="mt-2 text-xs text-ink-dim">{phase3Page.emptyDetails}</p>
        </div>
      </section>
    );
  }

  const broker = getBroker(load.brokerId);

  return (
    <section aria-label="Selected load details" className="panel overflow-hidden">
      <div className="flex items-start justify-between gap-2 border-b border-line/70 bg-linear-to-r from-blue/15 to-transparent p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-ink">{load.referenceNumber}</h2>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold tracking-wide text-success">{load.status.toUpperCase()}</span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-ink-dim">
            {formatLocation(load.originLocationId)} to {formatLocation(load.destinationLocationId)}
          </p>
        </div>
        <p className="text-2xl font-extrabold tabular-nums leading-none text-success">{formatCurrency(load.rate)}</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 p-3">
        <Fact icon={Star} label="Broker" sub={`${broker.rating} rating (${broker.reviewCount})`}>
          {broker.name}
        </Fact>
        <Fact icon={ClipboardList} label="Appointment">
          {load.appointmentType}
        </Fact>
        <Fact icon={MapPin} label="Pickup" sub={`${formatSimDay(load.pickupWindow.start)}, ${formatSimClock(load.pickupWindow.start)} - ${formatSimClock(load.pickupWindow.end)}`}>
          {formatLocation(load.originLocationId)}
        </Fact>
        <Fact icon={Flag} label="Delivery" sub={`${formatSimDay(load.deliveryWindow.start)}, ${formatSimClock(load.deliveryWindow.start)} - ${formatSimClock(load.deliveryWindow.end)}`}>
          {formatLocation(load.destinationLocationId)}
        </Fact>
        <Fact icon={Container} label="Equipment">
          {load.equipmentType}
        </Fact>
        <Fact icon={Scale} label="Weight">
          {load.weight.toLocaleString("en-US")} lbs
        </Fact>
        <Fact icon={Package} label="Commodity">
          {load.commodity}
        </Fact>
        <Fact icon={Route} label="Loaded Miles">
          {load.loadedMiles.toLocaleString("en-US")} mi
        </Fact>
        <div className="col-span-2">
          <Fact icon={CalendarClock} label="Requirements">
            {load.specialRequirements.length ? load.specialRequirements.join(", ") : "None"}
          </Fact>
        </div>
      </dl>
    </section>
  );
}
