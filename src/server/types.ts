export interface AuditEntry {
  id: number;
  user_id: number | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditQueryOptions {
  userId?: number;
  action?: string;
  resourceType?: string;
  dateStart?: string;
  dateEnd?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditQueryResult {
  entries: AuditEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditConfig {
  db: AuditDB;
  autoLog?: boolean;
}

export interface SetupAuditLogResult {
  router: import('express').Router;
  logger: AuditLogger;
}

import type { AuditDB } from './db/interface.js';
import type { AuditLogger } from './logger.js';
