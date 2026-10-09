const tones = {
  gold: "text-gold-bright",
  cyan: "text-cyan-bright",
  success: "text-success",
  ink: "text-ink",
};

export default function StatBadge({ icon: Icon, value, label, tone = "ink" }) {
  return (
    <div
      className="liquid-border liquid-border-subtle flex items-center gap-1.5 rounded-full app-border app-border-subtle bg-surface/50 px-3 py-1.5 backdrop-blur"
      title={label}
    >
      <Icon className={`size-4 ${tones[tone]}`} aria-hidden="true" />
      <span className="text-sm font-semibold tabular-nums text-ink">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
