"use client";

import { useCallback, useRef } from "react";
import type { InputEvent } from "@/lib/wse/types";

// Captures paste/blur *metadata* only (field name, character counts,
// timestamps) - never clipboard content. The final answer text is already
// captured separately in the scenario payload, which is all the CIQ
// duplicate-detection heuristic needs; this event log exists purely to
// support the timing/paste heuristics server-side.
export function useFieldInputTracking() {
  const eventsRef = useRef<InputEvent[]>([]);

  const recordEvent = useCallback((event: InputEvent) => {
    eventsRef.current.push(event);
  }, []);

  const getFieldHandlers = useCallback(
    (field: string) => ({
      onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pasted = e.clipboardData.getData("text");
        recordEvent({ type: "paste", field, charsPasted: pasted.length, t: Date.now() });
      },
      onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => {
        recordEvent({
          type: "field_blur",
          field,
          charCountFinal: e.target.value.length,
          t: Date.now(),
        });
      },
    }),
    [recordEvent]
  );

  const getEvents = useCallback((): InputEvent[] => eventsRef.current, []);

  return { recordEvent, getFieldHandlers, getEvents };
}
