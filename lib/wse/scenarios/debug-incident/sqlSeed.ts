// Static seed for the client-side SQL sandbox (sql.js, WASM SQLite, run in
// a Web Worker - see components/assessment/SqlSandboxPane.tsx). A real
// small relational schema, not one flat table - clients and their
// integration pattern, the orders they've submitted, and a history of the
// pool's configuration over time. pool_config_history in particular is a
// second, independent path to the same 50->12 fact the diff tab shows -
// deliberate, not redundant, now that the diff no longer flags which of
// its files is the relevant one.
export const SQL_SEED_STATEMENTS = `
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  integration_type TEXT NOT NULL,
  plan_tier TEXT NOT NULL
);
INSERT INTO clients (id, display_name, integration_type, plan_tier) VALUES
  ('acme-goods', 'Acme Goods', 'single', 'standard'),
  ('nova-supply', 'Nova Supply Co', 'single', 'standard'),
  ('brightline-foods', 'Brightline Foods', 'single', 'standard'),
  ('meridian-retail', 'Meridian Retail', 'batch', 'enterprise');

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  client TEXT NOT NULL,
  status TEXT NOT NULL,
  batch_size INTEGER NOT NULL,
  submitted_at TEXT NOT NULL
);
INSERT INTO orders (id, client, status, batch_size, submitted_at) VALUES
  (1, 'acme-goods', 'ok', 1, '09:14:02'),
  (2, 'nova-supply', 'ok', 1, '09:14:09'),
  (3, 'meridian-retail', 'failed', 140, '09:14:11'),
  (4, 'acme-goods', 'ok', 1, '09:14:15'),
  (5, 'meridian-retail', 'failed', 163, '09:14:22'),
  (6, 'nova-supply', 'ok', 1, '09:14:30'),
  (7, 'meridian-retail', 'failed', 155, '09:14:41'),
  (8, 'acme-goods', 'ok', 1, '09:14:45'),
  (9, 'meridian-retail', 'failed', 172, '09:14:52'),
  (10, 'nova-supply', 'ok', 1, '09:14:58'),
  (11, 'brightline-foods', 'ok', 1, '09:15:03'),
  (12, 'meridian-retail', 'failed', 168, '09:15:10'),
  (13, 'acme-goods', 'ok', 1, '09:15:17'),
  (14, 'meridian-retail', 'failed', 151, '09:15:24');

CREATE TABLE pool_config_history (
  id INTEGER PRIMARY KEY,
  changed_at TEXT NOT NULL,
  pool_size INTEGER NOT NULL,
  changed_by TEXT NOT NULL,
  note TEXT NOT NULL
);
INSERT INTO pool_config_history (id, changed_at, pool_size, changed_by, note) VALUES
  (1, '2026-04-02 10:00', 50, 'infra-bot', 'baseline'),
  (2, '2026-07-28 09:00', 12, 'infra-bot', 'cost optimization pass - reduce idle connection overhead');
`;
