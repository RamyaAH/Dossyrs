"use client";

import { useEffect, useRef, useState } from "react";
import { SQL_SEED_STATEMENTS } from "@/lib/wse/scenarios/debug-incident/sqlSeed";
import type { InputEvent } from "@/lib/wse/types";

const QUERY_TIMEOUT_MS = 3_000;
const MAX_ROWS = 200;

interface QueryResult {
  columns: string[];
  values: unknown[][];
}

interface PendingCall {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// Loaded via next/dynamic(..., { ssr: false }) only when this tab is first
// activated - never part of the scenario's initial bundle (see the dynamic
// import in DebugIncidentScenario.tsx). Runs in a real Web Worker using
// sql.js's own prebuilt worker.sql-wasm.js (copied verbatim into /public
// alongside its .wasm binary) so a runaway query - a cross join, a
// recursive CTE - can hang that worker thread without freezing the UI. A
// query that doesn't respond within QUERY_TIMEOUT_MS gets its worker
// killed outright and replaced, rather than trusted to ever come back.
export default function SqlSandboxPane({
  recordEvent,
}: {
  recordEvent: (event: InputEvent) => void;
}) {
  const workerRef = useRef<Worker | null>(null);
  const nextIdRef = useRef(1);
  const pendingRef = useRef<Map<number, PendingCall>>(new Map());

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sql, setSql] = useState(
    "SELECT client, COUNT(*) AS failures, AVG(batch_size) AS avg_batch\nFROM orders\nWHERE status = 'failed'\nGROUP BY client;"
  );
  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  function send(action: string, extra: Record<string, unknown> = {}): Promise<unknown> {
    const worker = workerRef.current;
    if (!worker) return Promise.reject(new Error("Sandbox not ready"));
    const id = nextIdRef.current++;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingRef.current.delete(id);
        reject(new Error("timeout"));
      }, QUERY_TIMEOUT_MS);
      pendingRef.current.set(id, { resolve, reject, timeout });
      worker.postMessage({ id, ...extra, action });
    });
  }

  function spawnWorker(): Worker {
    const worker = new Worker("/worker.sql-wasm.js");
    worker.onmessage = (event) => {
      const { id, results, error } = event.data as {
        id: number;
        results?: unknown;
        error?: string;
      };
      const pending = pendingRef.current.get(id);
      if (!pending) return;
      clearTimeout(pending.timeout);
      pendingRef.current.delete(id);
      if (error) pending.reject(new Error(error));
      else pending.resolve(results);
    };
    workerRef.current = worker;
    return worker;
  }

  useEffect(() => {
    spawnWorker();
    (async () => {
      try {
        await send("open");
        await send("exec", { sql: SQL_SEED_STATEMENTS });
        setReady(true);
      } catch {
        setLoadError("Sandbox failed to load — try reopening this tab.");
      }
    })();

    return () => {
      workerRef.current?.terminate();
      pendingRef.current.forEach((p) => clearTimeout(p.timeout));
      pendingRef.current.clear();
    };
    // Mount-once setup; re-running this on every render would leak workers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRun() {
    if (!ready || running) return;
    setRunning(true);
    setQueryError(null);
    try {
      const results = await send("exec", { sql });
      const first = Array.isArray(results) ? (results[0] as QueryResult | undefined) : undefined;
      const columns = first?.columns ?? [];
      const values = (first?.values ?? []).slice(0, MAX_ROWS);
      setResult({ columns, values });
      recordEvent({ type: "query_run", sql, rowCount: values.length, errored: false, t: Date.now() });
    } catch (e) {
      setResult(null);
      const message = e instanceof Error ? e.message : "Query failed";
      const timedOut = message === "timeout";
      setQueryError(timedOut ? "Query took too long and was stopped." : message);
      recordEvent({ type: "query_run", sql, rowCount: 0, errored: true, t: Date.now() });

      if (timedOut) {
        setReady(false);
        workerRef.current?.terminate();
        spawnWorker();
        try {
          await send("open");
          await send("exec", { sql: SQL_SEED_STATEMENTS });
          setReady(true);
        } catch {
          setLoadError("Sandbox failed to recover — try reopening this tab.");
        }
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        Query the live orders table directly — seeded from this incident&apos;s actual submission
        log.
      </p>
      <textarea
        className="rounded-md border border-border bg-surface p-3 font-mono text-xs text-ink outline-none focus:border-brand"
        rows={4}
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        spellCheck={false}
      />
      <button
        type="button"
        className="btn-secondary self-start"
        disabled={!ready || running}
        onClick={handleRun}
      >
        {running ? "Running…" : ready ? "Run query" : "Loading sandbox…"}
      </button>
      {loadError && <p className="text-sm text-danger">{loadError}</p>}
      {queryError && <p className="text-sm text-danger">{queryError}</p>}
      {result && (
        <div className="overflow-auto rounded-md border border-border">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-raised">
                {result.columns.map((col) => (
                  <th key={col} className="border-b border-border px-2 py-1.5 font-mono text-muted">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.values.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="border-b border-border px-2 py-1.5 font-mono text-ink last:border-0"
                    >
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {result.values.length === 0 && <p className="p-2 text-xs text-muted">No rows returned.</p>}
        </div>
      )}
    </div>
  );
}
