"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameProgress } from "@/hooks/useGameProgress";
import { homeFor } from "@/lib/routes";

// Entry point: route to login, onboarding or the level map.
export default function Page() {
  const router = useRouter();
  const { state, ready } = useGameProgress();

  useEffect(() => {
    if (!ready) return;
    router.replace(state.isAuthenticated ? homeFor(state) : "/login");
  }, [ready, state, router]);

  return <main className="game-backdrop min-h-screen" />;
}
