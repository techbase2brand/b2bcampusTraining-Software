import * as Icons from "lucide-react";
import { Lock } from "lucide-react";
import { dispatcherNav } from "@/data/navigation";
import { controlCenterMessage } from "@/data/onboarding";
import StepNav from "./StepNav";

const mapDots = [[20, 40], [35, 60], [55, 35], [70, 55], [80, 30], [48, 70]];
const dotTone = ["bg-success", "bg-gold-bright", "bg-cyan-bright"];

// Non-interactive preview. Only Dashboard, Trucks and Drivers are active in Phase 2.
export default function ControlCenterPreview({ onNext, onBack }) {
  return (
    <div>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-ink">Dispatcher Control Center</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ink-dim">{controlCenterMessage}</p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-[200px_1fr]">
        <ul className="space-y-1" aria-label="Control center sections">
          {dispatcherNav.map((item, i) => {
            const Icon = Icons[item.icon];
            const active = item.status === "enabled";
            return (
              <li
                key={item.id}
                className={`flex items-center gap-3 rounded-lg app-border px-3 py-2.5 text-sm ${
                  i === 0
                    ? "app-border-active bg-surface-2 font-semibold text-ink"
                    : active
                      ? "border-transparent text-ink"
                      : "border-transparent text-ink-dim opacity-60"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {!active && (
                  <span className="flex items-center gap-1 text-[11px] uppercase text-gold">
                    <Lock className="size-3" aria-hidden="true" />
                    {item.status === "preview" ? "Preview" : "Later"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {/* Mini dashboard mock (decorative) */}
        <div
          className="rounded-2xl border-2 app-border-active bg-navy-900 p-3 shadow-[0_0_30px_rgb(38_140_255/0.25)]"
          aria-hidden="true"
        >
          <div className="grid grid-cols-4 gap-2">
            {["Trucks", "Drivers", "Loads", "Revenue"].map((l) => (
              <div key={l} className="rounded-lg app-border bg-surface p-2">
                <div className="h-1.5 w-8 rounded bg-cyan/60" />
                <div className="mt-2 h-3 w-6 rounded bg-ink/70" />
                <p className="mt-1 text-[8px] text-ink-dim">{l}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-[1.6fr_1fr] gap-2">
            <div className="game-grid relative h-40 rounded-lg app-border bg-surface">
              {mapDots.map(([x, y], i) => (
                <span
                  key={i}
                  className={`absolute size-2 rounded-full ${dotTone[i % 3]}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                />
              ))}
            </div>
            <div className="space-y-2">
              {[0, 1, 2].map((n) => (
                <div key={n} className="h-12 rounded-lg app-border bg-surface" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}
