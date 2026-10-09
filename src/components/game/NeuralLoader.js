// A small animated "neural" loader for REAL loading or redirect states only (never a fake delay).
// Connected nodes with a slow flowing line: pure SVG + CSS, so it costs almost nothing and is static
// under prefers-reduced-motion.
const NODES = [
  [20, 60],
  [55, 25],
  [95, 55],
  [135, 20],
  [170, 62],
];
const LINKS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [1, 3],
];

export default function NeuralLoader({ label = "Loading" }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 text-center">
      <svg viewBox="0 0 190 80" className="h-20 w-48" aria-hidden="true">
        {LINKS.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke="rgb(37 217 255 / 0.5)" strokeWidth="1" className="neural-line" />
        ))}
        {NODES.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="#25d9ff" className="neural-node" style={{ animationDelay: `${i * 240}ms` }} />
        ))}
      </svg>
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-bright">{label}</p>
    </div>
  );
}
