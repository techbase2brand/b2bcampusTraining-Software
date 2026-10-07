import { Container, MapPin, UserRound, Gauge, Scale, Clock } from "lucide-react";
import { getTruckContext } from "@/lib/loadRules";
import { formatLocation } from "@/lib/loadSelectors";
import { formatDuration, formatSimTime, parseSimTime } from "@/lib/text";
import { simulationConfig } from "@/data/simulationConfig";
import TruckThumb from "@/components/dispatcher/TruckThumb";

// Assigned-truck context strip, built from real truck/driver/clock data (not hardcoded).
export default function AssignedTruckStrip() {
  const { truck, driver } = getTruckContext();
  const facts = [
    { icon: Container, label: "Equipment", value: truck.equipment, accent: true },
    { icon: MapPin, label: "Location", value: formatLocation(truck.locationId) },
    { icon: UserRound, label: "Driver", value: driver.name },
    { icon: Clock, label: "HOS Left", value: formatDuration(driver.hosMinutes), accent: true },
    { icon: Scale, label: "Max Weight", value: `${truck.maxWeightLbs.toLocaleString("en-US")} lbs`, accent: true },
  ];

  return (
    <section aria-label="Assigned truck" className="panel flex flex-wrap items-stretch gap-x-4 gap-y-3 p-3">
      <div className="flex items-center gap-3 pr-2 lg:border-r lg:border-line">
        <TruckThumb className="h-12 w-20 shrink-0 rounded-lg" />
        <div className="min-w-0">
          <p className="label-xs text-gold">Assigned Truck</p>
          <p className="text-lg font-extrabold leading-tight text-ink">{truck.id}</p>
          <p className="text-[11px] text-ink-dim">{truck.model}</p>
        </div>
      </div>

      <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-line/70">
        {facts.map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className="flex min-w-0 items-center gap-2.5 lg:px-4">
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${accent ? "bg-cyan/15 text-cyan-bright" : "bg-surface-2 text-ink-dim"}`}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="label-xs">{label}</dt>
              <dd className={`truncate text-sm font-bold ${accent ? "text-ink" : "text-ink"}`}>{value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <p className="flex items-center gap-1.5 self-center text-[11px] text-ink-dim" title="Simulation clock">
        <Gauge className="size-3.5" aria-hidden="true" />
        Sim time {formatSimTime(parseSimTime(simulationConfig.clock.now))}
      </p>
    </section>
  );
}
