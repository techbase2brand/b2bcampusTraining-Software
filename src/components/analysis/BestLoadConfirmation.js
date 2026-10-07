"use client";

import { selectionCopy } from "@/data/phase4Missions";
import { getLoad, formatLocation } from "@/lib/loadSelectors";
import { formatMetric } from "@/lib/analysisFormat";
import { formatSimDay, formatSimClock } from "@/lib/text";
import GameButton from "@/components/game/GameButton";
import GameModal from "@/components/game/GameModal";

// Confirmation before a load becomes the selected best candidate. Not a booking.
export default function BestLoadConfirmation({ m, loadId, onCancel, onConfirm }) {
  const a = m.analyses.find((x) => x.loadId === loadId);
  const load = a ? getLoad(a.loadId) : null;
  const rows = a && [
    ["Load", load.referenceNumber],
    ["Lane", `${formatLocation(load.originLocationId)} to ${formatLocation(load.destinationLocationId)}`],
    ["Posted Rate", formatMetric("currency", a.lineHaulRate)],
    ["Effective RPM", formatMetric("currencyPerMile", a.allInRpm)],
    ["Deadhead", formatMetric("miles", a.deadheadMiles)],
    ["Total Miles", formatMetric("miles", a.totalMiles)],
    ["Est. Fuel Cost", formatMetric("currency", a.fuelCost)],
    ["Est. Margin", formatMetric("currency", a.estimatedProfit)],
    ["Pickup", `${formatSimDay(load.pickupWindow.start)}, ${formatSimClock(load.pickupWindow.start)}`],
    ["Equipment", load.equipmentType],
  ];

  return (
    <GameModal open={Boolean(a)} onClose={onCancel} title={selectionCopy.confirmTitle}>
      {a && (
        <div>
          <h2 className="text-xl font-extrabold text-ink">{selectionCopy.confirmTitle}</h2>
          <p className="mt-1 text-xs text-ink-dim">{selectionCopy.confirmNote}</p>
          <dl className="mt-4 divide-y divide-line/50 rounded-xl border border-line bg-surface px-3">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-1.5">
                <dt className="text-xs text-ink-dim">{label}</dt>
                <dd className="text-sm font-semibold tabular-nums text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex justify-end gap-2">
            <GameButton variant="ghost" onClick={onCancel}>
              {selectionCopy.cancelButton}
            </GameButton>
            <GameButton onClick={onConfirm}>{selectionCopy.confirmButton}</GameButton>
          </div>
        </div>
      )}
    </GameModal>
  );
}
