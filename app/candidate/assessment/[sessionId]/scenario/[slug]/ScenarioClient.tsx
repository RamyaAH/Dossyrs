"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DebugIncidentScenario } from "@/components/assessment/DebugIncidentScenario";
import { SprintTriageScenario } from "@/components/assessment/SprintTriageScenario";
import { AmbiguousRequestScenario } from "@/components/assessment/AmbiguousRequestScenario";
import type { InputEvent } from "@/lib/wse/types";

export function ScenarioClient({
  sessionId,
  slug,
  progressLabel,
  nextSlug,
}: {
  sessionId: string;
  slug: string;
  progressLabel: string;
  nextSlug: string | null;
}) {
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // Idempotent "start" stamp - safe to call again on remount/refresh; the
    // route only sets started_at the first time a response row is created.
    fetch(`/api/wse/sessions/${sessionId}/scenarios/${slug}`, { method: "POST" }).catch(() => {
      // best-effort; duration_seconds simply falls back to the row's
      // created_at if this never lands
    });
  }, [sessionId, slug]);

  async function submitScenario(responsePayload: unknown, inputEvents: InputEvent[]) {
    const res = await fetch(`/api/wse/sessions/${sessionId}/scenarios/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responsePayload, inputEvents }),
    });

    if (!res.ok) {
      alert("Something went wrong submitting this scenario. Please try again.");
      return;
    }

    if (nextSlug) {
      router.push(`/candidate/assessment/${sessionId}/scenario/${nextSlug}`);
    } else {
      router.push(`/candidate/assessment/${sessionId}/complete`);
    }
  }

  if (slug === "debug-incident") {
    return <DebugIncidentScenario progressLabel={progressLabel} onSubmit={submitScenario} />;
  }

  if (slug === "sprint-triage") {
    return <SprintTriageScenario progressLabel={progressLabel} onSubmit={submitScenario} />;
  }

  if (slug === "ambiguous-request") {
    return <AmbiguousRequestScenario progressLabel={progressLabel} onSubmit={submitScenario} />;
  }

  return <p className="p-8 text-sm text-muted">This scenario isn&apos;t available yet.</p>;
}
