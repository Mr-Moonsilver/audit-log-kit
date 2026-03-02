import type { AuditEntry, AuditQueryOptions, AuditQueryResult } from '../types.js';

export interface AuditDB {
  initSchema(): void | Promise<void>;
  log(userId: number | null, action: string, resourceType: string, resourceId?: string | null, details?: string | null, ipAddress?: string | null): void | Promise<void>;
  query(options?: AuditQueryOptions): AuditQueryResult | Promise<AuditQueryResult>;
}
