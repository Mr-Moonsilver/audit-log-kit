import type { Express } from 'express';
import type { AuditConfig, SetupAuditLogResult } from './types.js';
import { AuditLogger } from './logger.js';
import { createAuditRouter } from './routes.js';

export function setupAuditLog(app: Express, config: AuditConfig): SetupAuditLogResult {
  config.db.initSchema();

  const logger = new AuditLogger(config.db);
  const router = createAuditRouter(config.db);

  if (config.autoLog) {
    app.use(logger.createAutoLogMiddleware());
  }

  return { router, logger };
}

export { AuditLogger } from './logger.js';
export { SqliteAuditDB } from './db/sqlite.js';
// PostgresAuditDB: import directly from 'audit-log-kit/server/db/postgres.js' to avoid transitive pg dependency
export type { AuditDB } from './db/interface.js';
export type { AuditConfig, AuditEntry, AuditQueryOptions, AuditQueryResult, SetupAuditLogResult } from './types.js';
