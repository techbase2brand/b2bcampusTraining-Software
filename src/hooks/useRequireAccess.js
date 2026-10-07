"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameProgress } from "./useGameProgress";

// Client-side route guard (dev only; real auth should guard on the server).
// onboarded: also require onboarding to be completed.
export function useRequireAccess({ onboarded = true } = {}) {
  const router = useRouter();
  const { state, ready, update, reset } = useGameProgress();

  let redirect = null;
  if (ready) {
    if (!state.isAuthenticated) redirect = "/login";
    else if (onboarded && !state.onboardingCompleted) redirect = "/onboarding";
  }

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  return { state, update, reset, allowed: ready && !redirect };
}
