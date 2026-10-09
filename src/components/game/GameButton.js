const variants = {
  primary: "btn-liquid",
  gold: "bg-linear-to-r from-gold to-gold-bright text-navy-950 hover:brightness-110 shadow-[0_0_20px_rgb(255_176_0/0.25)]",
  cyan: "bg-linear-to-r from-cyan to-blue text-navy-950 hover:brightness-110",
  ghost: "app-border bg-surface/80 text-ink hover:border-cyan hover:text-cyan-bright",
};

const sizes = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

export default function GameButton({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition ${variant === "primary" ? "liquid-border liquid-border-strong" : variant === "ghost" ? "liquid-border liquid-border-subtle" : ""} ${sizes[size]} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-bright disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
