// Wraps a UI element with the guided-training glow when it is the current task's target.
// Purely visual: never blocks pointer events.
export default function TaskHighlight({ active, className = "", children }) {
  return <div className={`rounded-lg ${active ? "guide-highlight" : ""} ${className}`}>{children}</div>;
}
