"use client";

import { Check } from "lucide-react";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";
import TruckThumb from "@/components/dispatcher/TruckThumb";

const STATUS_TONE = {
  AVAILABLE: "bg-success/15 text-success",
  "UNDER REVIEW": "bg-cyan/15 text-cyan-bright",
  "UNDER NEGOTIATION": "bg-gold/15 text-gold-bright",
  "RATE AGREED": "bg-success/25 text-success",
};

function Fact({ label, children, sub, wide = false }) {
  return (
    <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
      <dt className="label-xs">{label}</dt>
      <dd className="truncate text-xs font-semibold text-ink">{children}</dd>
      {sub && <dd className="truncate text-[11px] text-ink-dim">{sub}</dd>}
    </div>
  );
}

// The load carried forward from Load Analysis (selectedBestLoadId), with its live negotiation status.
// Everything shown is resolved from data through m.cc. The broker's name stays hidden until the
// mission starts, so the load context never gives away the answer to task 1.
export default function MissionLoadDetails({ m, highlight }) {
  const { load, broker, analysis, vars } = m.cc;
  const reviewed = m.comms.detailsReviewed;
  const started = m.run.started;
  const canReview = started && m.correctSelected && !reviewed;

  return (
    <section aria-label="Selected load details" className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line/70 bg-linear-to-r from-blue/15 to-transparent px-3 py-2">
        <h2 className="text-sm font-extrabold text-ink">Load Details ({vars.ref})</h2>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide ${STATUS_TONE[m.loadStatus]}`}>{m.loadStatus}</span>
      </div>

      <div className="flex items-center gap-2.5 px-3 pt-2.5">
        <TruckThumb className="h-12 w-[4.5rem] shrink-0 rounded-md" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-ink">
            {vars.origin} → {vars.destination}
          </p>
          <p className="text-xl font-extrabold leading-tight tabular-nums text-success">{vars.rate}</p>
          <p className="text-[11px] text-ink-dim">
            {load.loadedMiles.toLocaleString("en-US")} mi · ${analysis.allInRpm.toFixed(2)}/mi effective
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 px-3 py-2.5">
        <Fact label="Pickup" sub={`${vars.pickupTime} - ${vars.pickupEnd}`}>
          {vars.pickupDay}, {vars.origin}
        </Fact>
        <Fact label="Delivery" sub={`${vars.deliveryTime} - ${vars.deliveryEnd}`}>
          {vars.deliveryDay}, {vars.destination}
        </Fact>
        <Fact label="Equipment">{vars.equipment}</Fact>
        <Fact label="Weight">{vars.weight} lbs</Fact>
        <Fact label="Commodity">{vars.commodity}</Fact>
        <Fact label="Appointment">{vars.appointment}</Fact>
        <Fact label="Broker">{started ? broker.name : "Revealed when you start"}</Fact>
        <Fact label="Deadhead">{analysis.deadheadMiles} mi</Fact>
        <Fact label="Requirements" wide>
          {load.specialRequirements.length ? load.specialRequirements.join(", ") : "None listed"}
        </Fact>
      </dl>

      <div className="border-t border-line/60 px-3 py-2">
        <TaskHighlight active={highlight === "details-review"}>
          {reviewed ? (
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-success">
              <Check className="size-4" aria-hidden="true" /> Details reviewed
            </p>
          ) : (
            <GameButton variant="ghost" size="sm" className="w-full" disabled={!canReview} onClick={m.reviewDetails}>
              Mark Details Reviewed
            </GameButton>
          )}
        </TaskHighlight>
        {!reviewed && !canReview && <p className="mt-1 text-center text-[11px] text-ink-dim">{started ? "Select the correct broker first." : "Start the mission first."}</p>}
      </div>
    </section>
  );
}
