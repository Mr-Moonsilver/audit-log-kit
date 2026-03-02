import type { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { AuditDB } from './interface.js';
import type { AuditEntry, AuditQueryOptions, AuditQueryResult } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class PostgresAuditDB implements AuditDB {
  constructor(private pool: Pool) {}

  async initSchema(): Promise<void> {
    const schemaPath = join(__dirname, 'schema.pg.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    await this.pool.query(schema);
  }

  async log(userId: number | null, action: string, resourceType: string, resourceId?: string | null, details?: string | null, ipAddress?: string | null): Promise<void> {
    await this.pool.query(
      'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, action, resourceType, resourceId ?? null, details ?? null, ipAddress ?? null]
    );
  }

  async query(options?: AuditQueryOptions): Promise<AuditQueryResult> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 50, 200);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (options?.userId) {
      conditions.push(`user_id = $${paramIdx++}`);
      params.push(options.userId);
    }
    if (options?.action) {
      conditions.push(`action = $${paramIdx++}`);
      params.push(options.action);
    }
    if (options?.resourceType) {
      conditions.push(`resource_type = $${paramIdx++}`);
      params.push(options.resourceType);
    }
    if (options?.dateStart) {
      conditions.push(`created_at >= $${paramIdx++}`);
      params.push(options.dateStart);
    }
    if (options?.dateEnd) {
      conditions.push(`created_at <= $${paramIdx++}`);
      params.push(options.dateEnd);
    }
    if (options?.search) {
      conditions.push(`(action ILIKE $${paramIdx} OR resource_type ILIKE $${paramIdx} OR details::text ILIKE $${paramIdx})`);
      params.push(`%${options.search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: [countRow] } = await this.pool.query(
      `SELECT COUNT(*) as total FROM audit_log ${where}`,
      params
    );
    const total = Number(countRow.total);

    const { rows: entries } = await this.pool.query(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, limit, offset]
    );

    return { entries: entries as AuditEntry[], total, page, limit };
  }
}
