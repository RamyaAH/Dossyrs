"use client";

import { useState } from "react";
import type { DebugIncidentLogLine } from "@/lib/wse/scenarios/debug-incident/content";
import type { InputEvent } from "@/lib/wse/types";

// A structured filter tool, not a curated readout - the candidate has to
// actively search this raw log rather than read a short pre-filtered list
// with the relevant line already highlighted. Deliberately not a custom
// query grammar (Splunk SPL-style): nobody here is being scored on query
// syntax, so a bespoke parser would just be engineering cost with no
// assessment value. Plain client-side filtering over a static dataset.
export function LogSearchPane({
  lines,
  recordEvent,
}: {
  lines: DebugIncidentLogLine[];
  recordEvent: (event: InputEvent) => void;
}) {
  const clients = Array.from(new Set(lines.map((l) => l.client))).sort();

  const [level, setLevel] = useState("");
  const [client, setClient] = useState("");
  const [text, setText] = useState("");
  const [results, setResults] = useState<DebugIncidentLogLine[] | null>(null);

  function handleSearch() {
    const filtered = lines.filter((l) => {
      if (level && l.level !== level) return false;
      if (client && l.client !== client) return false;
      if (text && !l.msg.toLowerCase().includes(text.trim().toLowerCase())) return false;
      return true;
    });
    setResults(filtered);
    recordEvent({
      type: "log_query",
      level: level || null,
      client: client || null,
      text: text.trim() || null,
      resultCount: filtered.length,
      t: Date.now(),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        Search the raw log — {lines.length} lines across every client. Filter to find what matters.
      </p>
      <div className="flex flex-wrap gap-2">
        <select
          className="input"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="">Any level</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>
        <select
          className="input"
          value={client}
          onChange={(e) => setClient(e.target.value)}
        >
          <option value="">Any client</option>
          {clients.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          className="input flex-1"
          type="text"
          placeholder="Text in message contains…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="button" className="btn-secondary" onClick={handleSearch}>
          Search
        </button>
      </div>

      {results && (
        <div className="flex flex-col gap-1 font-mono text-xs">
          <p className="label-mono">
            {results.length} result{results.length === 1 ? "" : "s"}
          </p>
          {results.map((line, i) => (
            <div key={i} className="rounded px-2 py-1">
              <span className="text-muted">{line.time}</span>{" "}
              <span
                className={line.level === "ERROR" ? "font-semibold text-danger" : "text-muted"}
              >
                {line.level}
              </span>{" "}
              <span className="text-accent">{line.client}</span>{" "}
              <span className="text-ink">{line.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
