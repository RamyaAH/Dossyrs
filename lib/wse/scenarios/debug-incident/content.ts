import type { DebugActionChoice } from "./types";

// Fixed, non-adaptive scenario content. Everything a candidate sees is
// static per session — no branching, no personalization. The "evidence"
// below is internally consistent: the pool_size diff + the log lines +
// the architecture note all point to the same root cause, so a candidate
// who reads carefully can genuinely diagnose it, not just guess.

export const DEBUG_INCIDENT_BRIEFING = {
  title: "OrderSync API — elevated 5xx errors for one enterprise client",
  severity: "SEV-2",
  summary:
    "Since this morning's deploy, one enterprise client (Meridian Retail) has been seeing a rising rate of failed order submissions. Other clients are currently unaffected. You've been paged to investigate and stabilize.",
};

export const DEBUG_INCIDENT_LOG_LINES = [
  { time: "09:14:02", level: "INFO", msg: "order submitted ok client=acme-goods order_id=88213" },
  { time: "09:14:09", level: "INFO", msg: "order submitted ok client=nova-supply order_id=88214" },
  {
    time: "09:14:11",
    level: "ERROR",
    msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) client=meridian-retail batch_size=140",
    flagged: true,
  },
  { time: "09:14:15", level: "INFO", msg: "order submitted ok client=acme-goods order_id=88215" },
  {
    time: "09:14:22",
    level: "ERROR",
    msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) client=meridian-retail batch_size=163",
  },
  { time: "09:14:30", level: "INFO", msg: "order submitted ok client=nova-supply order_id=88216" },
  {
    time: "09:14:41",
    level: "ERROR",
    msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) client=meridian-retail batch_size=155",
  },
] as const;

export const DEBUG_INCIDENT_DIFF = {
  file: "config/db_pool_config.py",
  hunk: [
    { type: "context", text: "class OrderDbPoolConfig:" },
    { type: "remove", text: "    pool_size = 50" },
    { type: "add", text: "    pool_size = 12  # reduce DB compute cost per infra review" },
    { type: "context", text: "    timeout_seconds = 30" },
  ],
};

export const DEBUG_INCIDENT_ARCHITECTURE_NOTES = [
  "OrderSync API accepts order submissions from all clients through a shared DB connection pool (order-db).",
  "Most clients (acme-goods, nova-supply, ...) submit one order per call and release the connection almost immediately.",
  "Meridian Retail's integration submits orders in batches of 50-200 per call, holding a connection for the full batch duration.",
  "This morning's deploy reduced the shared pool size from 50 to 12 connections as a cost optimization.",
];

export interface DebugIncidentUpdate {
  from: string;
  text: string;
}

export const DEBUG_INCIDENT_UPDATES: DebugIncidentUpdate[] = [
  {
    from: "On-call bot",
    text: "SEV-2 declared. Meridian Retail reporting failed order submissions since ~09:14. Other clients green.",
  },
  {
    from: "Support",
    text: "Meridian's integration submits orders in batches of 50-200 per call, unlike our other clients who submit one at a time.",
  },
  {
    from: "Platform team",
    text: "Heads up — this morning's deploy reduced the order-db connection pool size from 50 to 12 (config/db_pool_config.py), as a cost optimization.",
  },
  {
    from: "On-call bot",
    text: "Meridian's failure rate is climbing — now affecting roughly 40% of their batch submissions.",
  },
];

export const DEBUG_INCIDENT_ACTION_OPTIONS: { value: DebugActionChoice; label: string }[] = [
  { value: "rollback", label: "Roll back this morning's deploy" },
  { value: "kill_switch", label: "Disable batch submissions for Meridian temporarily" },
  { value: "scale_pool", label: "Increase the DB connection pool size" },
  { value: "keep_investigating", label: "Keep investigating before taking action" },
];
