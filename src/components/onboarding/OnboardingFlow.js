"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { onboardingSteps } from "@/data/onboarding";
import BrandMark from "@/components/game/BrandMark";
import WelcomeStep from "./WelcomeStep";
import ProfileStep from "./ProfileStep";
import AgentStep from "./AgentStep";
import JourneyStep from "./JourneyStep";
import MechanicsStep from "./MechanicsStep";
import ControlCenterPreview from "./ControlCenterPreview";
import OnboardingComplete from "./OnboardingComplete";

// Steps 1..COUNTED are numbered "n / COUNTED"; the final Complete screen is not counted.
const COUNTED = onboardingSteps.length - 1;
const LAST = onboardingSteps.length - 1;

export default function OnboardingFlow() {
  const router = useRouter();
  const { state, update, allowed } = useRequireAccess({ onboarded: false });
  const [index, setIndex] = useState(0);

  if (!allowed) return <main className="game-backdrop min-h-screen" />;

  const stepId = onboardingSteps[index];
  const next = () => setIndex((i) => Math.min(i + 1, LAST));
  const back = () => setIndex((i) => Math.max(i - 1, 0));
  const finish = () => {
    update({ onboardingCompleted: true, avatarSelection: state.avatarSelection ?? "male" });
    router.push("/home");
  };
  const nav = { onNext: next, onBack: back };

  return (
    <main className="game-backdrop game-grid min-h-screen px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <BrandMark />
          {index === 0 ? (
            <button
              type="button"
              onClick={() => setIndex(LAST)}
              className="rounded-md app-border bg-surface px-3 py-1 text-xs text-ink-dim hover:text-cyan-bright"
            >
              Skip
            </button>
          ) : index < LAST ? (
            <p className="text-sm font-semibold tabular-nums text-ink-dim">
              {index + 1} / {COUNTED}
            </p>
          ) : null}
        </header>

        <div key={stepId} className="animate-fade-up">
          {stepId === "welcome" && <WelcomeStep onNext={next} />}
          {stepId === "profile" && <ProfileStep state={state} update={update} {...nav} />}
          {stepId === "agent" && <AgentStep state={state} {...nav} />}
          {stepId === "journey" && <JourneyStep {...nav} />}
          {stepId === "mechanics" && <MechanicsStep {...nav} />}
          {stepId === "control-center" && <ControlCenterPreview {...nav} />}
          {stepId === "complete" && <OnboardingComplete state={state} onFinish={finish} onBack={back} />}
        </div>

        {index < LAST && (
          <div className="mt-8 flex justify-center gap-2" aria-hidden="true">
            {onboardingSteps.slice(0, COUNTED).map((id, i) => (
              <span
                key={id}
                className={`size-2 rounded-full transition-colors ${i <= index ? "bg-cyan-bright" : "bg-line"}`}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
