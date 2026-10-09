import { Star } from "lucide-react";
import { mission03 } from "@/data/phase4Missions";
import { getLoad } from "@/lib/loadSelectors";
import { formatMetric } from "@/lib/analysisFormat";

// Metric value for a load. "deliveryTime" is the pickup-to-delivery transit time.
const valueFor = (key, a) => (key === "deliveryTime" ? a.transitMinutes : a[key]);

// Side-by-side comparison. The Overall Score row stays hidden until the decision is accepted, and no
// cell is colored as "best", so the answer is never given away.
export default function ComparisonTable({ m, highlight }) {
  const { analyses, ranked } = m;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-120 border-separate border-spacing-0 text-left text-xs">
        <caption className="sr-only">Load analysis comparison</caption>
        <thead>
          <tr>
            <th scope="col" className="border-b border-line bg-navy-900 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-dim">
              Metrics
            </th>
            {analyses.map((a) => (
              <th key={a.loadId} scope="col" className={`border-b border-line bg-navy-900 px-3 py-2 text-center text-xs font-bold ${m.detailLoadId === a.loadId ? "text-cyan-bright" : "text-ink"}`}>
                {getLoad(a.loadId).referenceNumber}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mission03.comparisonMetrics.map((row) => {
            const glow = row.highlightId && highlight === row.highlightId;
            return (
              <tr key={row.key} className={`transition-colors ${glow ? "bg-cyan/10 shadow-[inset_3px_0_0_#25d9ff]" : "hover:bg-surface-2/50"}`}>
                <th scope="row" className="border-b border-line/40 px-3 py-2 text-left text-[11px] font-medium text-ink-dim">
                  {row.label}
                </th>
                {analyses.map((a) => (
                  <td key={a.loadId} className="border-b border-line/40 px-3 py-2 text-center font-semibold tabular-nums text-ink">
                    {row.hidden ? (
                      ranked ? (
                        <span className="inline-flex gap-0.5" role="img" aria-label={`${ranked.find((r) => r.loadId === a.loadId).stars} of 5 stars`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`size-3 ${n <= ranked.find((r) => r.loadId === a.loadId).stars ? "fill-gold-bright text-gold-bright" : "text-line"}`} aria-hidden="true" />
                          ))}
                        </span>
                      ) : (
                        <span className="text-[11px] font-normal text-ink-dim">Revealed after your decision</span>
                      )
                    ) : (
                      formatMetric(row.format, valueFor(row.key, a))
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
