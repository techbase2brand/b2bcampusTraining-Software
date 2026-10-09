import { statusTones, healthTones } from "@/data/dashboardStatus";

const TONE = {
  cyan: "app-border-active bg-cyan/10 text-cyan-bright",
  blue: "app-border-active bg-blue/15 text-[#7fb6ff]",
  amber: "app-border-warning bg-gold/10 text-gold-bright",
  green: "app-border-success bg-success/10 text-success",
  red: "app-border-error bg-danger/10 text-danger",
};

// One badge style for every dispatch status and shipment health value on the Dashboard.
export default function StatusBadge({ statusId, health, label }) {
  const tone = health ? healthTones[health] : statusTones[statusId];
  return <span className={`inline-block whitespace-nowrap rounded-full app-border px-2 py-0.5 text-[11px] font-bold tracking-wide ${TONE[tone] ?? TONE.cyan}`}>{label}</span>;
}

export const toneClasses = TONE;
