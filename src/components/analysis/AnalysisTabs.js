"use client";

import { useState } from "react";
import { mission03 } from "@/data/phase4Missions";
import { simulationConfig } from "@/data/simulationConfig";
import { getLoad, getBroker } from "@/lib/loadSelectors";
import { formatMetric } from "@/lib/analysisFormat";
import ComparisonTable from "./ComparisonTable";
import LoadRoutePreview from "@/components/loadboard/LoadRoutePreview";
import { Star } from "lucide-react";

function Stat({ label, value }) {
  return (
    <div className="rounded-lg app-border app-border-subtle bg-navy-900/60 px-3 py-2">
      <dt className="label-xs">{label}</dt>
      <dd className="text-sm font-extrabold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

// Comparison / Route & Map / Cost Breakdown / Broker Details for the loads under review.
export default function AnalysisTabs({ m, highlight, tab, onTab }) {
  const [localTab, setLocalTab] = useState("comparison");
  const active = tab ?? localTab;
  const setTab = onTab ?? setLocalTab;
  const a = m.analyses.find((x) => x.loadId === m.detailLoadId);
  const load = a ? getLoad(a.loadId) : null;

  return (
    <section aria-label="Analysis views" className="panel overflow-hidden">
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-line/70 px-2 pt-2">
        {mission03.tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg app-border border-b-0 px-3.5 py-2 text-xs font-semibold transition-colors ${
              active === t.id ? "app-border-active bg-blue text-white" : " bg-surface/70 text-ink-dim hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-3">
        {active === "comparison" && <ComparisonTable m={m} highlight={highlight} />}

        {active === "route" && a && (
          <div className="grid gap-3 md:grid-cols-[1fr_14rem]">
            <LoadRoutePreview load={load} />
            <dl className="grid grid-cols-2 gap-2 self-start md:grid-cols-1">
              <Stat label="Total Miles" value={formatMetric("miles", a.totalMiles)} />
              <Stat label="Deadhead" value={formatMetric("miles", a.deadheadMiles)} />
              <Stat label="Est. Fuel Cost" value={formatMetric("currency", a.fuelCost)} />
              <Stat label="Est. Margin" value={formatMetric("currency", a.estimatedProfit)} />
            </dl>
          </div>
        )}

        {active === "cost" && a && (
          <div>
            <p className="text-xs text-ink-dim">
              {load.referenceNumber}: fuel at ${simulationConfig.fuel.pricePerGallon.toFixed(2)}/gal and {simulationConfig.fuel.milesPerGallon} mpg, other operating cost ${simulationConfig.operatingCostPerMile.toFixed(2)}/mi, over {formatMetric("miles", a.totalMiles)}.
            </p>
            <ul className="mt-3 space-y-2.5">
              {[
                ["Line Haul Rate", a.lineHaulRate, "bg-success"],
                ["Estimated Fuel Cost", a.fuelCost, "bg-gold"],
                ["Other Operating Cost", a.operatingCost, "bg-blue"],
                ["Estimated Margin", a.estimatedProfit, "bg-cyan"],
              ].map(([label, value, color]) => (
                <li key={label}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-ink-dim">{label}</span>
                    <span className="font-bold tabular-nums text-ink">{formatMetric("currency", value)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy-800">
                    <div className={`h-full rounded-full ${color} transition-[width] duration-500`} style={{ width: `${Math.max(2, Math.round((value / a.lineHaulRate) * 100))}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {active === "broker" && load && (() => {
          const b = getBroker(load.brokerId);
          return (
            <dl className="grid gap-2 sm:grid-cols-2">
              <Stat label="Broker" value={b.name} />
              <Stat label="MC Number" value={b.mcNumber} />
              <Stat label="Payment Terms" value={b.paymentTerms} />
              <Stat label="Average Response" value={b.avgResponse} />
              <div className="rounded-lg app-border app-border-subtle bg-navy-900/60 px-3 py-2">
                <dt className="label-xs">Rating</dt>
                <dd className="flex items-center gap-1 text-sm font-extrabold text-ink">
                  <Star className="size-3.5 fill-gold-bright text-gold-bright" aria-hidden="true" /> {b.rating} ({b.reviewCount} reviews)
                </dd>
              </div>
              <Stat label="Appointment" value={load.appointmentType} />
            </dl>
          );
        })()}
      </div>
    </section>
  );
}
