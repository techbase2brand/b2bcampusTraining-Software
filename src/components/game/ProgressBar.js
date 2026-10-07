const tones = {
  cyan: "from-cyan to-cyan-bright",
  gold: "from-gold to-gold-bright",
  success: "from-success to-cyan",
};

export default function ProgressBar({ value, max = 100, tone = "cyan", label, className = "" }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={`h-2 w-full overflow-hidden rounded-full bg-navy-800 ${className}`}
    >
      <div
        className={`h-full rounded-full bg-linear-to-r ${tones[tone]} transition-[width] duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
