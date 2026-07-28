"use client";

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import type { InputEvent } from "@/lib/wse/types";

// Controlled-ish CodeMirror 6 wrapper: `value` seeds the initial document
// once (this is a single scored form field in an assessment flow, not a
// full editor the parent needs to re-seed later), and `onChange` is the
// one-way flow back out. Paste/blur are captured through the same
// InputEvent shapes useFieldInputTracking already emits for text fields -
// no new event types needed.
export function CodeEditorPane({
  value,
  onChange,
  recordEvent,
  fieldName = "codeEditor",
}: {
  value: string;
  onChange: (value: string) => void;
  recordEvent: (event: InputEvent) => void;
  fieldName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const recordEventRef = useRef(recordEvent);
  recordEventRef.current = recordEvent;

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;

      onChangeRef.current(update.state.doc.toString());

      for (const tr of update.transactions) {
        if (tr.isUserEvent("input.paste")) {
          const pastedChars = tr.newDoc.length - tr.startState.doc.length;
          if (pastedChars > 0) {
            recordEventRef.current({
              type: "paste",
              field: fieldName,
              charsPasted: pastedChars,
              t: Date.now(),
            });
          }
        }
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        python(),
        updateListener,
        EditorView.theme({
          "&": {
            fontSize: "12px",
            height: "100%",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-ink)",
          },
          ".cm-content": {
            fontFamily: "ui-monospace, monospace",
            minHeight: "100%",
            caretColor: "var(--color-brand)",
          },
          ".cm-gutters": {
            backgroundColor: "var(--color-surface)",
            color: "var(--color-muted)",
            border: "none",
          },
          ".cm-activeLine": { backgroundColor: "var(--color-surface-raised)" },
          ".cm-activeLineGutter": { backgroundColor: "var(--color-surface-raised)" },
          ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
            backgroundColor: "var(--color-brand-bg)",
          },
          "&.cm-focused .cm-cursor": { borderLeftColor: "var(--color-brand)" },
          ".cm-scroller": { overflow: "auto" },
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });

    const handleBlur = () => {
      recordEventRef.current({
        type: "field_blur",
        field: fieldName,
        charCountFinal: view.state.doc.length,
        t: Date.now(),
      });
    };
    view.dom.addEventListener("blur", handleBlur, true);

    return () => {
      view.dom.removeEventListener("blur", handleBlur, true);
      view.destroy();
    };
    // Seed once on mount; this field is one-way (editor -> parent state)
    // after that, matching every other scored field in this scenario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[20rem] overflow-hidden rounded-md border border-border"
    />
  );
}
