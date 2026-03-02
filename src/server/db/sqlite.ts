import { Database } from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { AuditDB } from './interface.js';
import type { AuditEntry, AuditQueryOptions, AuditQueryResult } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SqliteAuditDB implements AuditDB {
  constructor(private db: Database) {}

  initSchema(): void {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
  }

  log(userId: number | null, action: string, resourceType: string, resourceId?: string | null, details?: string | null, ipAddress?: string | null): void {
    this.db.prepare(
      'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, action, resourceType, resourceId ?? null, details ?? null, ipAddress ?? null);
  }

  query(options?: AuditQueryOptions): AuditQueryResult {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 50, 200);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (options?.userId) {
      conditions.push('user_id = ?');
      params.push(options.userId);
    }
    if (options?.action) {
      conditions.push('action = ?');
      params.push(options.action);
    }
    if (options?.resourceType) {
      conditions.push('resource_type = ?');
      params.push(options.resourceType);
    }
    if (options?.dateStart) {
      conditions.push('created_at >= ?');
      params.push(options.dateStart);
    }
    if (options?.dateEnd) {
      conditions.push('created_at <= ?');
      params.push(options.dateEnd);
    }
    if (options?.search) {
      conditions.push('(action LIKE ? OR resource_type LIKE ? OR details LIKE ?)');
      const term = `%${options.search}%`;
      params.push(term, term, term);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = this.db.prepare(`SELECT COUNT(*) as total FROM audit_log ${where}`).get(...params) as { total: number };
    const total = countRow.total;

    const entries = this.db.prepare(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as AuditEntry[];

    return { entries, total, page, limit };
  }
}
