import { Eye } from "lucide-react";
import { fmtDateTime } from "@/lib/trackingComms";
import { formatCurrency } from "@/lib/text";
import StatusBadge from "@/components/dashboard/StatusBadge";

const when = (iso) => (iso ? fmtDateTime(new Date(iso)) : "-");

// A finished dispatch: one compact, quieter row. The only action is View (the dispatch's detail route).
export default function CompletedDispatchRow({ record: r, onView }) {
  return (
    <li className="liquid-border liquid-border-subtle grid items-center gap-x-3 gap-y-1 rounded-xl bg-navy-900/50 px-3 py-2 sm:grid-cols-[5.5rem_minmax(0,1.3fr)_minmax(0,1fr)_5.5rem_8rem_auto_auto]">
      <p className="text-sm font-extrabold text-ink">#{r.number}</p>
      <p className="min-w-0 truncate text-xs text-ink">
        <span className="font-bold text-cyan-bright">{r.reference ?? "-"}</span> {r.route && <span className="text-ink-dim">· {r.route}</span>}
      </p>
      <p className="min-w-0 truncate text-xs text-ink-dim">{r.driverName ? `${r.driverName} / ${r.truckId}` : "No driver"}</p>
      <p className="text-xs font-semibold text-success">{r.agreedRate != null ? formatCurrency(r.agreedRate) : "-"}</p>
      <p className="text-[11px] text-ink-dim">{when(r.completedAt)}</p>
      <StatusBadge statusId="completed" label={r.statusLabel} />
      <button type="button" onClick={() => onView(r.resumeRoute)} aria-label={`View dispatch ${r.number}`} className="inline-flex items-center gap-1 justify-self-end rounded-md app-border app-border-active bg-cyan/10 px-2.5 py-1 text-xs font-bold text-cyan-bright transition-colors hover:bg-cyan/20">
        <Eye className="size-3.5" aria-hidden="true" /> View
      </button>
    </li>
  );
}
