import type { AuditEntry, AuditQueryOptions, AuditQueryResult } from '../types.js';

export interface AuditDB {
  initSchema(): void;
  log(userId: number | null, action: string, resourceType: string, resourceId?: string | null, details?: string | null, ipAddress?: string | null): void;
  query(options?: AuditQueryOptions): AuditQueryResult;
}
