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

// Multi-file workspace, for the editable code tab - a real dev fixing this
// wouldn't touch just one config file, so the candidate can inspect and
// edit both the pool config and the calling code that actually submits
// Meridian's oversized batches. Each file's starting source doubles as its
// "seed" for the commit flow's structural diff (CommitPanel compares
// current content against this array, not against any semantic model).
export interface DebugIncidentFile {
  id: string;
  path: string;
  source: string;
}

export const DEBUG_INCIDENT_FILES: DebugIncidentFile[] = [
  {
    id: "db_pool_config",
    path: "config/db_pool_config.py",
    source: `class OrderDbPoolConfig:
    pool_size = 12  # reduce DB compute cost per infra review
    timeout_seconds = 30
`,
  },
  {
    id: "order_service",
    path: "services/order_service.py",
    source: `class OrderService:
    def submit_batch(self, client_id, orders):
        # Meridian Retail submits 50-200 orders per call and holds a
        # DB connection for the full batch duration. No retry/backoff
        # on pool exhaustion today - a timeout here just fails the batch.
        with self.db_pool.acquire() as conn:
            for order in orders:
                conn.insert(order)
`,
  },
];

export const DEBUG_INCIDENT_ARCHITECTURE_NOTES = [
  "OrderSync API accepts order submissions from all clients through a shared DB connection pool (order-db).",
  "Most clients (acme-goods, nova-supply, ...) submit one order per call and release the connection almost immediately.",
  "Meridian Retail's integration submits orders in batches of 50-200 per call, holding a connection for the full batch duration.",
  "This morning's deploy reduced the shared pool size from 50 to 12 connections as a cost optimization.",
];

// Read-only infra reference, styled as a generic infra dashboard rather
// than a pixel-accurate cloud-console skin (avoids a trademark-lookalike
// question for no real benefit - candidates get the same information
// either way). Not part of DEBUG_INCIDENT_FILES since it's reference-only,
// never edited or diffed.
export const DEBUG_INCIDENT_INFRA_RESOURCES = [
  { label: "Instance", value: "order-db (managed relational DB, prod)" },
  { label: "Max connections (instance ceiling)", value: "100" },
  { label: "Reserved for other services sharing this instance", value: "~35" },
  { label: "OrderSync app pool size (current)", value: "12 (reduced from 50 this morning)" },
  { label: "Region", value: "us-east-1" },
];

export interface Persona {
  id: string;
  name: string;
  role: string;
  personality: string;
}

// Static, pre-authored character context — no LLM involved. Named/titled
// so the persona rail and chat thread can show who's actually in the
// incident, instead of a generic "On-call bot" label.
export const DEBUG_INCIDENT_PERSONAS: Persona[] = [
  {
    id: "oncall-bot",
    name: "On-call bot",
    role: "Automated paging",
    personality: "Terse, factual, no fluff.",
  },
  {
    id: "support",
    name: "Priya",
    role: "Enterprise Support Lead",
    personality: "Customer-first — translates impact into business terms.",
  },
  {
    id: "platform",
    name: "Dev",
    role: "Platform Engineer",
    personality: "Owns the regression, gives precise technical context.",
  },
];

export interface DebugIncidentUpdate {
  personaId: string;
  text: string;
}

// Scene-setting only - safe to ship client-side since it's identical
// regardless of what the candidate does next. Everything that actually
// reacts to a candidate's choice lives server-only in ./branch.ts so the
// decision tree itself never reaches the browser bundle.
export const DEBUG_INCIDENT_OPENING_MESSAGE: DebugIncidentUpdate = {
  personaId: "oncall-bot",
  text: "SEV-2 declared. Meridian Retail reporting failed order submissions since ~09:14. Other clients green.",
};

export const DEBUG_INCIDENT_ACTION_OPTIONS: { value: DebugActionChoice; label: string }[] = [
  { value: "rollback", label: "Roll back this morning's deploy" },
  { value: "kill_switch", label: "Disable batch submissions for Meridian temporarily" },
  { value: "scale_pool", label: "Increase the DB connection pool size" },
  { value: "keep_investigating", label: "Keep investigating before taking action" },
];
