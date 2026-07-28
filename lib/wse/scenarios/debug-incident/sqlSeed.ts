// Static seed for the client-side SQL sandbox (sql.js, WASM SQLite, run in
// a Web Worker - see components/assessment/SqlSandboxPane.tsx). Mirrors the
// same submission log already shown in the Error log tab, just queryable
// instead of only readable, so a candidate can actually do data analysis
// instead of eyeballing a handful of lines.
export const SQL_SEED_STATEMENTS = `
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
  (10, 'nova-supply', 'ok', 1, '09:14:58');
`;
