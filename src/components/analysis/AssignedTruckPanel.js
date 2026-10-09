import { getTruckContext } from "@/lib/loadRules";
import { formatLocation } from "@/lib/loadSelectors";
import { formatDuration } from "@/lib/text";
import { phase4Page } from "@/data/phase4Missions";
import TruckThumb from "@/components/dispatcher/TruckThumb";

// Assigned truck and driver context, from real truck/driver data.
export default function AssignedTruckPanel() {
  const { truck, driver } = getTruckContext();
  const rows = [
    ["Equipment", truck.equipment],
    ["Current Location", formatLocation(truck.locationId)],
    ["Driver", driver.name],
    ["Remaining HOS", formatDuration(driver.hosMinutes)],
    ["Max Weight", `${truck.maxWeightLbs.toLocaleString("en-US")} lbs`],
  ];
  return (
    <section aria-label="Assigned truck" className="panel p-3">
      <h2 className="panel-title">{phase4Page.truckTitle}</h2>
      <div className="mt-2.5 flex items-center gap-3">
        <TruckThumb className="h-14 w-24 shrink-0 rounded-lg" />
        <div>
          <p className="text-lg font-extrabold leading-tight text-ink">{truck.id}</p>
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold uppercase text-success">{truck.status}</span>
        </div>
      </div>
      <dl className="mt-3 space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-2 border-b border-line/40 pb-1.5 last:border-0">
            <dt className="text-[11px] text-ink-dim">{label}</dt>
            <dd className="text-xs font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
