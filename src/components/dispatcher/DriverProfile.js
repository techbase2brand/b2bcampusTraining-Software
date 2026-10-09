import { ArrowLeft } from "lucide-react";
import { drivers } from "@/data/drivers";
import { formatHos } from "@/lib/format";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "./TaskHighlight";
import { availabilityStyle } from "./DriverList";

export default function DriverProfile({ driverId, onBack, highlight }) {
  const d = drivers.find((x) => x.id === driverId);

  return (
    <div>
      <GameButton variant="ghost" onClick={onBack}>
        <ArrowLeft className="size-4" aria-hidden="true" /> All Drivers
      </GameButton>
      <h1 className="mt-5 text-2xl font-extrabold text-ink">{d.name}</h1>

      <dl className="mt-5 max-w-xl divide-y divide-line/60 rounded-2xl app-border bg-surface px-5">
        <Row label="Driver ID" value={d.id} />
        <Row label="Assigned Truck" value={d.truckId} />
        <Row
          label="Availability"
          value={
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${availabilityStyle[d.availability]}`}>
              {d.availability}
            </span>
          }
        />
      </dl>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wider text-ink-dim">Driver Status</h2>
      <dl className="mt-2 max-w-xl space-y-2">
        <TaskHighlight active={highlight === "location"}>
          <Row label="Current Location" value={d.location} boxed />
        </TaskHighlight>
        <Row label="Duty Status" value={d.dutyStatus} boxed />
        <TaskHighlight active={highlight === "hos"}>
          <Row label="Remaining HOS" value={formatHos(d.hosMinutes)} boxed />
        </TaskHighlight>
      </dl>
    </div>
  );
}

function Row({ label, value, boxed }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3 ${
        boxed ? "rounded-lg app-border bg-surface px-4" : ""
      }`}
    >
      <dt className="text-sm text-ink-dim">{label}</dt>
      <dd className="text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
