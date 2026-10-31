// Content for the mocked cloud-resources console (CloudConsolePane).
// Deliberately lean - 2 pages, not a full multi-service mock - per an
// explicit scope decision to control this scenario's total time-on-task.
// Own generic branding, not a pixel-accurate skin of any real provider's
// console (same trademark-avoidance reasoning as the tab it replaces).

export const CLOUD_CONSOLE_RDS_INSTANCE = {
  instanceId: "order-db-prod-01",
  engine: "PostgreSQL 15.4",
  instanceClass: "db.r6g.xlarge",
  region: "us-east-1",
  maxConnections: 100,
  reservedForOtherServices: 35,
  currentAppPoolSize: 12,
};

// Meridian's connection-pool-exhaustion error count per minute during the
// incident window - a different angle on impact than the SQL sandbox's
// pool_config_history table (that's the config change; this is the
// resulting error volume), not a duplicate of it.
export const CLOUD_CONSOLE_ERROR_METRICS: { label: string; value: number }[] = [
  { label: "09:14", value: 3 },
  { label: "09:15", value: 4 },
  { label: "09:16", value: 3 },
];
