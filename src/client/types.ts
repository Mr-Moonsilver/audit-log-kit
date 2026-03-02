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

export interface AuditQueryParams {
  user_id?: number;
  action?: string;
  resource_type?: string;
  date_start?: string;
  date_end?: string;
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
