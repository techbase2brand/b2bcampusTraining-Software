import { statusTones, healthTones } from "@/data/dashboardStatus";

const TONE = {
  cyan: "border-cyan/40 bg-cyan/10 text-cyan-bright",
  blue: "border-blue/40 bg-blue/15 text-[#7fb6ff]",
  amber: "border-gold/40 bg-gold/10 text-gold-bright",
  green: "border-success/40 bg-success/10 text-success",
  red: "border-danger/40 bg-danger/10 text-danger",
};

// One badge style for every dispatch status and shipment health value on the Dashboard.
export default function StatusBadge({ statusId, health, label }) {
  const tone = health ? healthTones[health] : statusTones[statusId];
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${TONE[tone] ?? TONE.cyan}`}>{label}</span>;
}

export const toneClasses = TONE;
