"use client";

import { useState } from "react";
import { Search, RotateCcw, LocateFixed, CalendarDays, SlidersHorizontal, ChevronDown } from "lucide-react";
import { filterSections, radiusOptions, equipmentOptions, loadTypeOptions } from "@/data/loadFilters";
import { simulationConfig } from "@/data/simulationConfig";
import { locations } from "@/data/locations";
import { getTruckContext } from "@/lib/loadRules";
import { simDateKey } from "@/lib/text";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";

const field =
  "h-8 w-full min-w-0 rounded-md app-border bg-navy-900 px-2 text-xs text-ink outline-none transition-colors placeholder:text-ink-dim/60 hover:border-line/80 focus:border-cyan focus:ring-1 focus:ring-cyan/40";
const quick = "mt-1 flex items-center gap-1 text-[11px] text-cyan-bright hover:underline";
const toNumber = (value) => (value === "" ? null : Number(value));
const toggle = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

function Option({ label, checked, onChange }) {
  return (
    <label
      className={`flex h-7 cursor-pointer items-center gap-1.5 rounded-md app-border px-2 text-xs transition-colors ${
        checked ? "app-border-active bg-cyan/10 text-ink" : " bg-navy-900 text-ink-dim hover:border-line/80 hover:text-ink"
      }`}
    >
      <input type="checkbox" className="size-3.5 accent-cyan" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

// Horizontal filter bar above the results. Edits are drafted locally and applied with "Search
// Loads" (like a real board). The parent re-mounts it (via `key`) when applied filters change from
// outside. Secondary filters (load type, rate) live under "More Filters".
export default function LoadFilters({ applied, onApply, onReset, highlight }) {
  const [draft, setDraft] = useState(applied);
  // Open the secondary row automatically when one of its filters is already active.
  const [moreOpen, setMore] = useState(Boolean(applied.loadTypes.length || applied.minRate != null || applied.maxRate != null || applied.maxWeight != null || applied.maxLengthFt != null));
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const { truck } = getTruckContext();
  const today = simDateKey(simulationConfig.clock.now);
  const section = (id) => filterSections.find((s) => s.id === id);
  // A guided task can point at a secondary filter: keep its section open while it is highlighted.
  const more = moreOpen || (section("size").highlight != null && highlight === section("size").highlight);
  const wrap = (id, children) => (
    <TaskHighlight active={highlight === section(id).highlight} className="min-w-0 p-0.5">
      <fieldset className="min-w-0">
        <legend className="label-xs mb-1">{section(id).label}</legend>
        {children}
      </fieldset>
    </TaskHighlight>
  );

  return (
    <form
      aria-label="Filters"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft);
      }}
      className="panel p-3"
    >
      <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.25fr_1.25fr_1.1fr_1.3fr]">
        {wrap(
          "pickup",
          <>
            <LocationRadius
              label={section("pickup").label}
              locationId={draft.pickupLocationId}
              radius={draft.pickupRadiusMiles}
              onLocation={(v) => set({ pickupLocationId: v })}
              onRadius={(v) => set({ pickupRadiusMiles: v })}
            />
            <button type="button" onClick={() => set({ pickupLocationId: truck.locationId })} className={quick}>
              <LocateFixed className="size-3" aria-hidden="true" /> Use truck location
            </button>
          </>,
        )}

        {wrap(
          "destination",
          <LocationRadius
            label={section("destination").label}
            locationId={draft.destinationLocationId}
            radius={draft.destinationRadiusMiles}
            onLocation={(v) => set({ destinationLocationId: v })}
            onRadius={(v) => set({ destinationRadiusMiles: v })}
          />,
        )}

        {wrap(
          "dates",
          <>
            <div className="grid grid-cols-2 gap-1.5">
              <input aria-label="Pickup from date" type="date" className={field} value={draft.pickupDateFrom ?? ""} onChange={(e) => set({ pickupDateFrom: e.target.value || null })} />
              <input aria-label="Pickup to date" type="date" className={field} value={draft.pickupDateTo ?? ""} onChange={(e) => set({ pickupDateTo: e.target.value || null })} />
            </div>
            <button type="button" onClick={() => set({ pickupDateFrom: today, pickupDateTo: today })} className={quick}>
              <CalendarDays className="size-3" aria-hidden="true" /> Today ({today})
            </button>
          </>,
        )}

        {wrap(
          "equipment",
          <div className="flex flex-wrap gap-1.5">
            {equipmentOptions.map((e) => (
              <Option key={e} label={e} checked={draft.equipmentTypes.includes(e)} onChange={() => set({ equipmentTypes: toggle(draft.equipmentTypes, e) })} />
            ))}
          </div>,
        )}

      </div>

      {more && (
        <div className="mt-2.5 grid gap-x-3 gap-y-2.5 border-t border-line/60 pt-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {wrap(
            "size",
            <div className="grid grid-cols-2 gap-1.5">
              <input aria-label="Maximum weight (lbs)" inputMode="numeric" className={field} placeholder="Max lbs" value={draft.maxWeight ?? ""} onChange={(e) => set({ maxWeight: toNumber(e.target.value) })} />
              <input aria-label="Maximum length (ft)" inputMode="numeric" className={field} placeholder="Max ft" value={draft.maxLengthFt ?? ""} onChange={(e) => set({ maxLengthFt: toNumber(e.target.value) })} />
            </div>,
          )}
          {wrap(
            "requirements",
            <div className="flex flex-wrap gap-1.5">
              {loadTypeOptions.map((t) => (
                <Option key={t.id} label={t.label} checked={draft.loadTypes.includes(t.id)} onChange={() => set({ loadTypes: toggle(draft.loadTypes, t.id) })} />
              ))}
            </div>,
          )}
          {wrap(
            "rate",
            <div className="grid max-w-56 grid-cols-2 gap-1.5">
              <input aria-label="Minimum rate" inputMode="numeric" className={field} placeholder="Min $" value={draft.minRate ?? ""} onChange={(e) => set({ minRate: toNumber(e.target.value) })} />
              <input aria-label="Maximum rate" inputMode="numeric" className={field} placeholder="Max $" value={draft.maxRate ?? ""} onChange={(e) => set({ maxRate: toNumber(e.target.value) })} />
            </div>,
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/60 pt-2.5">
        <GameButton type="submit" size="sm">
          <Search className="size-3.5" aria-hidden="true" /> Search Loads
        </GameButton>
        <GameButton type="button" variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="size-3.5" aria-hidden="true" /> Reset Filters
        </GameButton>
        <button
          type="button"
          onClick={() => setMore((v) => !v)}
          aria-expanded={more}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-cyan-bright hover:underline"
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          {more ? "Fewer Filters" : "More Filters"}
          <ChevronDown className={`size-3.5 transition-transform ${more ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

function LocationRadius({ label, locationId, radius, onLocation, onRadius }) {
  return (
    <div className="grid grid-cols-[1fr_4.75rem] gap-1.5">
      <select aria-label={label} className={field} value={locationId ?? ""} onChange={(e) => onLocation(e.target.value || null)}>
        <option value="">Anywhere</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.city}, {l.state}
          </option>
        ))}
      </select>
      <select aria-label={`${label} radius`} className={field} value={radius} onChange={(e) => onRadius(Number(e.target.value))}>
        {radiusOptions.map((r) => (
          <option key={r} value={r}>
            +{r} mi
          </option>
        ))}
      </select>
    </div>
  );
}
