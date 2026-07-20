"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SCENARIO_REGISTRY } from "@/lib/wse/scenarios/registry";

export function StartAssessmentButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    const res = await fetch("/api/wse/sessions", { method: "POST" });
    if (!res.ok) {
      alert("Could not start the assessment. Please try again.");
      setLoading(false);
      return;
    }
    const { id } = (await res.json()) as { id: string };
    router.push(`/candidate/assessment/${id}/scenario/${SCENARIO_REGISTRY[0].slug}`);
  }

  return (
    <button type="button" className="btn-primary" onClick={handleStart} disabled={loading}>
      {loading ? "Starting…" : "Start assessment"}
    </button>
  );
}
