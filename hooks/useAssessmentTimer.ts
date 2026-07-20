"use client";

import { useEffect, useState } from "react";

// Visible, informational elapsed-time display only - never used for
// scoring or CIQ. Real duration is always server-stamped at submit time
// (see wse_scenario_responses.duration_seconds), so this timer can't be
// gamed by pausing the tab or tampering with client state.
export function useAssessmentTimer(startedAtMs: number) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAtMs]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return { elapsedSeconds, formatted };
}
