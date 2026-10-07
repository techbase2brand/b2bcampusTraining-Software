"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGameProgress } from "@/hooks/useGameProgress";
import { devLogin } from "@/lib/devAuth";
import { homeFor } from "@/lib/routes";
import GameButton from "@/components/game/GameButton";

const inputClass =
  "w-full rounded-lg border border-line bg-navy-900 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-dim/60 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/30";

export default function LoginForm() {
  const router = useRouter();
  const { state, update } = useGameProgress();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgot, setForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    const result = devLogin(identifier, password, state.profile);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    update({ isAuthenticated: true, profile: result.profile });
    router.push(homeFor(state));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-ink">
          Email / Student ID
        </label>
        <input
          id="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter your email or student ID"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-dim hover:text-cyan-bright"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-ink-dim">
          <input type="checkbox" defaultChecked className="size-4 accent-cyan" />
          Remember me
        </label>
        <button
          type="button"
          onClick={() => setForgot((v) => !v)}
          className="text-cyan-bright hover:underline"
        >
          Forgot password?
        </button>
      </div>

      {forgot && (
        <p className="rounded-lg border border-line bg-navy-900 p-3 text-xs text-ink-dim">
          Password reset is not available in the development build.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      <GameButton type="submit" className="w-full">
        Login
      </GameButton>
      <p className="text-center text-xs text-ink-dim">
        New here? Contact your training coordinator
      </p>
      <p className="text-center text-[10px] text-ink-dim/70">
        Dev build: any valid email or Student ID with a 4+ character password works.
      </p>
    </form>
  );
}
