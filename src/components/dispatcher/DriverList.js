import { drivers } from "@/data/drivers";
import { formatHos } from "@/lib/format";

export const availabilityStyle = {
  Available: "bg-success/15 text-success",
  "On Load": "bg-gold/15 text-gold-bright",
  Unavailable: "bg-danger/15 text-danger",
};

export default function DriverList({ onSelect }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Drivers</h1>
      <p className="mt-1 text-sm text-ink-dim">Select a driver to open their profile.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {drivers.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect(d.id)}
            className="rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-cyan"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink">{d.name}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${availabilityStyle[d.availability]}`}>
                {d.availability}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-dim">
              {d.id} · {d.truckId}
            </p>
            <p className="mt-3 text-sm text-ink-dim">{d.location}</p>
            <p className="mt-1 text-sm text-ink-dim">
              {d.dutyStatus} · <span className="text-cyan-bright">{formatHos(d.hosMinutes)} HOS</span>
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
