import { ArrowLeft, ArrowRight } from "lucide-react";
import GameButton from "@/components/game/GameButton";

export default function StepNav({ onBack, onNext, nextLabel = "Next", nextDisabled = false, children }) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      {onBack ? (
        <GameButton variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden="true" /> Back
        </GameButton>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap items-center gap-3">
        {children}
        <GameButton onClick={onNext} disabled={nextDisabled}>
          {nextLabel} <ArrowRight className="size-4" aria-hidden="true" />
        </GameButton>
      </div>
    </div>
  );
}
