import type { DebugActionChoice } from "./types";
import type { Persona, PersonaMessage } from "../shared/persona";

// Fixed, non-adaptive scenario content. Everything a candidate sees is
// static per session — no branching, no personalization. The "evidence"
// below is internally consistent: the pool_size diff + the log lines +
// the architecture note all point to the same root cause, so a candidate
// who reads carefully can genuinely diagnose it, not just guess.

export const DEBUG_INCIDENT_BRIEFING = {
  title: "OrderSync API — elevated 5xx errors for one enterprise client",
  severity: "SEV-2",
  summary:
    "Since this morning's 09:00 deploy, one enterprise client (Meridian Retail) has been seeing a rising rate of failed order submissions — currently trending toward a probable SLA breach if it isn't resolved soon. Other clients are unaffected. Meridian is a top-5 account by order volume, and their integrations team has already opened a ticket asking what changed. Cloud-provider status pages and network monitoring are both green, so this points to something in our own stack, not an upstream outage. You've been paged as the on-call engineer to investigate and stabilize.",
};

export interface DebugIncidentLogLine {
  time: string;
  level: "INFO" | "WARN" | "ERROR";
  client: string;
  msg: string;
}

// A real raw log, not a curated evidence list - meant to be searched, not
// read top to bottom. Meridian's pool-exhaustion errors are in here, but
// so is a deliberate, unrelated red herring (a validation error on a
// different client, a different failure mode entirely) so that "any ERROR
// line" isn't itself the signal - client + error text both have to match.
export const DEBUG_INCIDENT_LOG_LINES: DebugIncidentLogLine[] = [
  { time: "09:14:00", level: "INFO", client: "acme-goods", msg: "order submitted ok order_id=88213" },
  { time: "09:14:04", level: "INFO", client: "nova-supply", msg: "order submitted ok order_id=88214" },
  { time: "09:14:07", level: "INFO", client: "brightline-foods", msg: "order submitted ok order_id=88220" },
  { time: "09:14:11", level: "ERROR", client: "meridian-retail", msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) batch_size=140" },
  { time: "09:14:13", level: "INFO", client: "acme-goods", msg: "order submitted ok order_id=88215" },
  { time: "09:14:17", level: "INFO", client: "nova-supply", msg: "order submitted ok order_id=88216" },
  { time: "09:14:22", level: "ERROR", client: "meridian-retail", msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) batch_size=163" },
  { time: "09:14:25", level: "INFO", client: "brightline-foods", msg: "order submitted ok order_id=88221" },
  { time: "09:14:29", level: "INFO", client: "acme-goods", msg: "order submitted ok order_id=88217" },
  { time: "09:14:33", level: "WARN", client: "notifications-svc", msg: "delivery retrying for order_id=88213 (timeout, attempt 1/3)" },
  { time: "09:14:36", level: "INFO", client: "nova-supply", msg: "order submitted ok order_id=88218" },
  { time: "09:14:41", level: "ERROR", client: "meridian-retail", msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) batch_size=155" },
  { time: "09:14:44", level: "INFO", client: "acme-goods", msg: "order submitted ok order_id=88219" },
  { time: "09:14:48", level: "INFO", client: "brightline-foods", msg: "order submitted ok order_id=88222" },
  { time: "09:14:52", level: "ERROR", client: "meridian-retail", msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) batch_size=172" },
  { time: "09:14:55", level: "INFO", client: "nova-supply", msg: "order submitted ok order_id=88223" },
  { time: "09:14:59", level: "INFO", client: "acme-goods", msg: "order submitted ok order_id=88224" },
  { time: "09:15:03", level: "INFO", client: "brightline-foods", msg: "order submitted ok order_id=88225" },
  { time: "09:15:07", level: "ERROR", client: "meridian-retail", msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) batch_size=148" },
  { time: "09:15:10", level: "INFO", client: "nova-supply", msg: "order submitted ok order_id=88226" },
  { time: "09:15:14", level: "WARN", client: "notifications-svc", msg: "delivery retrying for order_id=88216 (timeout, attempt 1/3)" },
  { time: "09:15:18", level: "INFO", client: "acme-goods", msg: "order submitted ok order_id=88227" },
  { time: "09:15:22", level: "ERROR", client: "meridian-retail", msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) batch_size=181" },
  { time: "09:15:25", level: "INFO", client: "brightline-foods", msg: "order submitted ok order_id=88228" },
  { time: "09:15:29", level: "INFO", client: "nova-supply", msg: "order submitted ok order_id=88229" },
  { time: "09:15:33", level: "ERROR", client: "acme-goods", msg: "invalid_order_payload: missing sku field order_id=88230" },
  { time: "09:15:37", level: "INFO", client: "acme-goods", msg: "order submitted ok order_id=88231" },
  { time: "09:15:40", level: "ERROR", client: "meridian-retail", msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) batch_size=151" },
  { time: "09:15:44", level: "INFO", client: "brightline-foods", msg: "order submitted ok order_id=88232" },
  { time: "09:15:48", level: "INFO", client: "nova-supply", msg: "order submitted ok order_id=88233" },
  { time: "09:15:52", level: "ERROR", client: "meridian-retail", msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) batch_size=169" },
  { time: "09:15:55", level: "INFO", client: "acme-goods", msg: "order submitted ok order_id=88234" },
  { time: "09:15:59", level: "WARN", client: "notifications-svc", msg: "delivery retrying for order_id=88221 (timeout, attempt 1/3)" },
  { time: "09:16:03", level: "INFO", client: "brightline-foods", msg: "order submitted ok order_id=88235" },
  { time: "09:16:07", level: "ERROR", client: "meridian-retail", msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) batch_size=176" },
  { time: "09:16:10", level: "INFO", client: "nova-supply", msg: "order submitted ok order_id=88236" },
  { time: "09:16:14", level: "INFO", client: "acme-goods", msg: "order submitted ok order_id=88237" },
  { time: "09:16:18", level: "ERROR", client: "meridian-retail", msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) batch_size=158" },
  { time: "09:16:22", level: "INFO", client: "brightline-foods", msg: "order submitted ok order_id=88238" },
  { time: "09:16:25", level: "INFO", client: "nova-supply", msg: "order submitted ok order_id=88239" },
  { time: "09:16:29", level: "ERROR", client: "meridian-retail", msg: "connection pool exhausted: timed out waiting for connection (pool=order-db, size=12) batch_size=164" },
  { time: "09:16:33", level: "INFO", client: "acme-goods", msg: "order submitted ok order_id=88240" },
];

// Today's deploy touched three files - only one is actually relevant to
// this incident. No visual flagging of which one matters; the candidate
// has to read all three and reason about relevance against the rest of
// the evidence, the same way a real deploy's diff doesn't come pre-
// annotated with "this is the bug".
export const DEBUG_INCIDENT_DIFF: {
  file: string;
  hunk: { type: "context" | "add" | "remove"; text: string }[];
}[] = [
  {
    file: "config/db_pool_config.py",
    hunk: [
      { type: "context", text: "class OrderDbPoolConfig:" },
      { type: "remove", text: "    pool_size = 50" },
      { type: "add", text: "    pool_size = 12  # reduce DB compute cost per infra review" },
      { type: "context", text: "    timeout_seconds = 30" },
    ],
  },
  {
    file: "config/logging_config.py",
    hunk: [
      { type: "context", text: "class LoggingConfig:" },
      { type: "remove", text: '    level = "WARN"' },
      { type: "add", text: '    level = "INFO"  # more visibility per last week\'s postmortem' },
      { type: "context", text: "    json_format = True" },
    ],
  },
  {
    file: "services/retry_policy.py",
    hunk: [
      { type: "context", text: "class RetryPolicy:" },
      { type: "remove", text: "    max_attempts = 3" },
      { type: "add", text: "    max_attempts = 3  # unchanged, comment cleanup only" },
      { type: "context", text: "    backoff_seconds = 2" },
    ],
  },
];

// Multi-file workspace, for the editable code tab - a real dev fixing this
// wouldn't touch just one config file, so the candidate can inspect and
// edit both the pool config and the calling code that actually submits
// Meridian's oversized batches. Each file's starting source doubles as its
// "seed" for the commit flow's structural diff (CommitPanel compares
// current content against this array, not against any semantic model).
// `editable` defaults to false - only the two files that actually matter
// to the incident are ever opened in a real (Python-only) CodeMirror
// instance; everything else is a real file in the tree for realism but
// renders read-only, and is never part of the scored surface.
export interface DebugIncidentFile {
  id: string;
  path: string;
  source: string;
  editable?: boolean;
}

export const DEBUG_INCIDENT_FILES: DebugIncidentFile[] = [
  {
    id: "db_pool_config",
    path: "config/db_pool_config.py",
    editable: true,
    source: `class OrderDbPoolConfig:
    pool_size = 12  # reduce DB compute cost per infra review
    timeout_seconds = 30
`,
  },
  {
    id: "order_service",
    path: "services/order_service.py",
    editable: true,
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
  {
    id: "user_service",
    path: "services/user_service.py",
    source: `class UserService:
    def get_profile(self, user_id):
        return self.db.query(User).filter_by(id=user_id).first()
`,
  },
  {
    id: "notification_service",
    path: "services/notification_service.py",
    source: `class NotificationService:
    def dispatch(self, order_id):
        # Retries are handled by the queue worker, not here.
        self.queue.publish("notify", {"order_id": order_id})
`,
  },
  {
    id: "test_order_service",
    path: "tests/test_order_service.py",
    source: `def test_submit_batch_inserts_all_orders():
    service = OrderService(db_pool=fake_pool())
    service.submit_batch("acme-goods", [fake_order(), fake_order()])
    assert fake_pool().insert_count == 2
`,
  },
  {
    id: "readme",
    path: "README.md",
    source: `# OrderSync

Accepts order submissions from all Dossyr integration clients and writes
them to order-db via a shared connection pool. See config/db_pool_config.py
for pool settings.
`,
  },
  {
    id: "docker_compose",
    path: "docker-compose.yml",
    source: `version: "3"
services:
  ordersync:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - order-db
`,
  },
];

export const DEBUG_INCIDENT_ARCHITECTURE_NOTES = [
  "Every client request reaches OrderSync through an API gateway, which applies per-client rate limits before forwarding. Meridian's requests are all reaching OrderSync successfully — none are being rejected or throttled upstream, so the failure is happening inside OrderSync itself, not before it.",
  "OrderSync API accepts order submissions from all clients through a single shared DB connection pool (order-db) — there's no per-client isolation at the pool level today.",
  "Most clients (acme-goods, nova-supply, ...) submit one order per API call and release their connection back to the pool almost immediately.",
  "Meridian Retail's integration is structurally different: it submits orders in batches of 50-200 per call, and holds a single connection for the entire batch's duration rather than releasing it per order.",
  "order-db is shared infrastructure, not dedicated to OrderSync — the Billing service and the Notifications service also hold connections against the same pool. Neither of those services changed today.",
  "This morning's deploy included a cost-optimization change to the shared pool's configuration — see the deploy diff and current config for specifics.",
  "OrderSync deploys go out through the standard CI/CD pipeline. There is no canary or staged-rollout stage configured for this service yet, so a configuration change reaches 100% of production traffic immediately on merge.",
];

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

// Scene-setting only - safe to ship client-side since it's identical
// regardless of what the candidate does next. Everything that actually
// reacts to a candidate's choice lives server-only in ./branch.ts so the
// decision tree itself never reaches the browser bundle.
export const DEBUG_INCIDENT_OPENING_MESSAGE: PersonaMessage = {
  personaId: "oncall-bot",
  text: "SEV-2 declared. Meridian Retail reporting failed order submissions since ~09:14. Other clients green.",
};

export const DEBUG_INCIDENT_ACTION_OPTIONS: { value: DebugActionChoice; label: string }[] = [
  { value: "rollback", label: "Roll back this morning's deploy" },
  { value: "kill_switch", label: "Disable batch submissions for Meridian temporarily" },
  { value: "scale_pool", label: "Increase the DB connection pool size" },
  { value: "keep_investigating", label: "Keep investigating before taking action" },
];
