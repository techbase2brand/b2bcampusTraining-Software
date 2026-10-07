import { MapPin, UserRound } from "lucide-react";
import { trucks } from "@/data/trucks";
import { drivers } from "@/data/drivers";
import TruckThumb from "./TruckThumb";

export const truckStatusStyle = {
  Available: "bg-success/15 text-success",
  "On Load": "bg-gold/15 text-gold-bright",
  "In Maintenance": "bg-danger/15 text-danger",
};

export default function TruckList({ onSelect }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Trucks</h1>
      <p className="mt-1 text-sm text-ink-dim">Select a truck to open its profile.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {trucks.map((t) => {
          const driver = drivers.find((d) => d.id === t.driverId);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className="rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-cyan"
            >
              <TruckThumb className="mb-3 h-28 w-full rounded-xl" />
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">{t.id}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${truckStatusStyle[t.status]}`}>
                  {t.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-dim">{t.model}</p>
              <p className="mt-2 text-sm font-semibold text-cyan-bright">{t.equipment}</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-dim">
                <MapPin className="size-3.5" aria-hidden="true" /> {t.location}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-dim">
                <UserRound className="size-3.5" aria-hidden="true" /> {driver?.name}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
