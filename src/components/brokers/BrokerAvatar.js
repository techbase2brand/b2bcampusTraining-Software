const TONES = ["bg-blue/25 text-cyan-bright", "bg-success/20 text-success", "bg-gold/20 text-gold-bright", "bg-cyan/20 text-cyan-bright", "bg-danger/20 text-danger", "bg-surface-2 text-ink"];

// Initials badge standing in for a broker logo. The colour is derived from the broker id, so it is stable.
export default function BrokerAvatar({ broker, className = "size-10 text-sm" }) {
  const initials = broker.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const tone = TONES[[...broker.id].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-xl app-border border-white/10 font-extrabold ${tone} ${className}`}>
      {initials}
    </span>
  );
}

export const STATUS_STYLE = {
  online: { dot: "bg-success", text: "text-success", label: "Online" },
  away: { dot: "bg-gold-bright", text: "text-gold-bright", label: "Away" },
  offline: { dot: "bg-ink-dim", text: "text-ink-dim", label: "Offline" },
};
