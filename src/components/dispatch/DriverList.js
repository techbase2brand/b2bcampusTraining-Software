"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { phase6Page } from "@/data/phase6Missions";
import { rosterFilterOptions } from "@/data/dispatchComms";
import { getRoster, getEquipmentOptions, filterRoster, displayStatus } from "@/lib/dispatchRoster";
import { formatDuration } from "@/lib/text";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";
import BrokerAvatar from "@/components/brokers/BrokerAvatar";

const STATUS_TONE = {
  Available: { dot: "bg-success", text: "text-success" },
  Driving: { dot: "bg-blue", text: "text-cyan-bright" },
  "On Break": { dot: "bg-gold-bright", text: "text-gold-bright" },
  "Off Duty": { dot: "bg-ink-dim", text: "text-ink-dim" },
  Unavailable: { dot: "bg-danger", text: "text-danger" },
};

const SELECT = "min-w-0 rounded-md app-border bg-navy-900 px-1.5 py-1 text-[11px] text-ink outline-none focus:border-cyan";

// Driver roster with search and filters. Whether a driver is suitable is never shown here: the
// student has to review each driver's details and run the checks.
export default function DriverList({ m, highlight }) {
  const [query, setQuery] = useState("");
  const [equipment, setEquipment] = useState("");
  const [availability, setAvailability] = useState("");
  const [hos, setHos] = useState("any");
  const visible = filterRoster(getRoster(), { query, equipment, availability, hos });

  return (
    <TaskHighlight active={highlight === "driver-list"} className="h-full">
      <section aria-label="Drivers" className="panel flex h-full flex-col p-3">
        <h2 className="flex items-center justify-between text-sm font-extrabold text-ink">
          {phase6Page.driversTitle}
          <span className="text-[11px] font-semibold text-ink-dim">
            {visible.length} / {getRoster().length}
          </span>
        </h2>

        <label className="mt-2.5 flex items-center gap-2 rounded-lg app-border bg-navy-900 px-2.5 py-1.5 text-xs text-ink-dim focus-within:border-cyan">
          <Search className="size-3.5 shrink-0" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, truck, location..." aria-label="Search drivers" className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-dim/70" />
        </label>

        <div className="mt-1.5 grid grid-cols-2 gap-1">
          <select value={equipment} onChange={(e) => setEquipment(e.target.value)} aria-label="Filter by equipment" className={SELECT}>
            <option value="">Equipment</option>
            {getEquipmentOptions().map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select value={availability} onChange={(e) => setAvailability(e.target.value)} aria-label="Filter by availability" className={SELECT}>
            <option value="">Status</option>
            {rosterFilterOptions.availability.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select value={hos} onChange={(e) => setHos(e.target.value)} aria-label="Filter by remaining HOS" className={`${SELECT} col-span-2`}>
            {rosterFilterOptions.hos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {!m.run.started && <p className="mt-2 rounded-md bg-gold/10 px-2 py-1.5 text-[11px] text-ink-dim">Start the mission to review drivers.</p>}
        <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
          {visible.map((e) => {
            const active = m.viewDriverId === e.id;
            const selected = m.d.selectedDriverId === e.id;
            const status = displayStatus(e);
            const tone = STATUS_TONE[status];
            // A warning appears only for drivers whose failing check the student has already run.
            const shown = m.d.driverChecks[e.id] ?? [];
            const failed = m.verdictFor(e).checks.some((c) => !c.passed && shown.includes(c.code));
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => m.viewDriver(e.id)}
                  disabled={!m.run.started}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-2 rounded-lg app-border px-2 py-1.5 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${
                    selected
                      ? "liquid-border liquid-border--active app-border-active bg-cyan/15"
                      : failed
                        ? "app-border-warning bg-gold/5"
                        : active
                          ? "app-border-active bg-cyan/5"
                          : " bg-navy-900/60 enabled:hover:border-cyan/50"
                  }`}
                >
                  <BrokerAvatar broker={e.driver} className="size-8 text-xs" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-bold leading-tight text-ink">{e.driver.name}</span>
                      {selected && <span className="rounded bg-cyan/20 px-1 text-[11px] font-bold uppercase text-cyan-bright">Selected</span>}
                      {!selected && failed && <span className="rounded bg-gold/20 px-1 text-[11px] font-bold uppercase text-gold-bright">Check failed</span>}
                    </span>
                    <span className="block truncate text-[11px] text-ink-dim">
                      {e.truck.id} · {e.truck.equipment} · {e.driver.location}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-ink-dim">
                      <span className={`flex items-center gap-1 font-semibold ${tone.text}`}>
                        <span className={`size-1.5 rounded-full ${tone.dot}`} /> {status}
                      </span>
                      <span className="ml-auto tabular-nums">HOS {formatDuration(e.driver.hosMinutes)}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {visible.length === 0 && <li className="rounded-lg app-border border-dashed p-4 text-center text-xs text-ink-dim">No drivers match.</li>}
        </ul>
      </section>
    </TaskHighlight>
  );
}
