import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";

const styles = {
  success: { box: "border-success/40 border-l-4 border-l-success bg-success/10", icon: CheckCircle2, color: "text-success" },
  error: { box: "border-danger/40 border-l-4 border-l-danger bg-danger/10", icon: XCircle, color: "text-danger" },
  hint: { box: "border-gold/40 border-l-4 border-l-gold bg-gold/10", icon: Lightbulb, color: "text-gold-bright" },
};

export default function TrainingFeedback({ tone, children }) {
  const s = styles[tone];
  const Icon = s.icon;
  return (
    <div role="status" className={`animate-fade-up flex gap-2.5 rounded-lg border p-2.5 text-xs leading-relaxed text-ink ${s.box}`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${s.color}`} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
