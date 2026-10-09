import { Check } from "lucide-react";
import { avatarOptions } from "@/data/onboarding";
import GameImage from "@/components/game/GameImage";
import AvatarPreview from "./AvatarPreview";
import StepNav from "./StepNav";

export default function ProfileStep({ state, update, onNext, onBack }) {
  const { profile, avatarSelection } = state;
  const info = [
    ["Student", profile.name],
    ["Role", profile.role],
    ["Starting Level", "Level 1"],
    ["Course", profile.course],
  ];

  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="text-3xl font-bold text-ink">Choose Your Avatar</h2>
      <p className="mt-2 text-sm text-ink-dim">Select a virtual trainer avatar to represent you in the training world.</p>

      <div role="radiogroup" aria-label="Avatar" className="mt-8 grid grid-cols-2 gap-5">
        {avatarOptions.map((opt) => {
          const selected = avatarSelection === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => update({ avatarSelection: opt.id })}
              className={`group relative overflow-hidden rounded-2xl border-2 bg-surface text-left transition ${
                selected ? "app-border-active shadow-[0_0_30px_rgb(38_140_255/0.35)]" : " hover:border-cyan/60"
              }`}
            >
              <GameImage
                src={`/images/avatar-${opt.id}.png`}
                alt=""
                className="aspect-4/5 w-full"
                fallback={
                  <div className="absolute inset-0 grid place-items-center bg-linear-to-b from-surface-2 to-navy-900">
                    <AvatarPreview gender={opt.id} selected={selected} size="lg" />
                  </div>
                }
              />
              {selected && (
                <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-blue text-white">
                  <Check className="size-4" aria-label="Selected" />
                </span>
              )}
              <div className="flex items-center justify-center gap-2 border-t border-line bg-navy-900/90 py-3 text-sm font-semibold text-ink">
                <span className={`grid size-4 place-items-center rounded-full app-border ${selected ? "app-border-active bg-blue" : "border-ink-dim"}`}>
                  {selected && <span className="size-1.5 rounded-full bg-white" />}
                </span>
                {opt.label}
              </div>
            </button>
          );
        })}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
        {info.map(([label, value]) => (
          <div key={label} className="rounded-xl app-border bg-surface px-4 py-2.5">
            <dt className="text-[11px] text-ink-dim">{label}</dt>
            <dd className="truncate text-sm font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <StepNav onBack={onBack} onNext={onNext} nextLabel="Continue" nextDisabled={!avatarSelection} />
    </div>
  );
}
