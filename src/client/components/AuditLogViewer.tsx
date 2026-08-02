import { useState, useEffect } from 'react';
import { auditApi } from '../api.js';
import type { AuditEntry } from '../types.js';

const ACTION_OPTIONS = ['', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

function truncate(str: string | null, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

/** `details` is TEXT on SQLite but JSONB on Postgres, where the driver returns a parsed
 *  object. Rendering that object as a React child throws, so always coerce to a string. */
function detailsText(details: unknown): string {
  if (details == null) return '';
  if (typeof details === 'string') return details;
  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

function ActionBadge({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    GET: 'badge-info',
    POST: 'badge-success',
    PUT: 'badge-warning',
    PATCH: 'badge-warning',
    DELETE: 'badge-danger',
  };
  const cls = colorMap[action] || '';
  return <span className={`badge ${cls}`}>{action}</span>;
}

export function AuditLogViewer() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filter state
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [search, setSearch] = useState('');

  // Applied filters (only sent on Search click)
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string | number | undefined>>({});

  const totalPages = Math.ceil(total / limit);

  async function loadEntries(filters: Record<string, string | number | undefined>, pg: number) {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | undefined> = { ...filters, page: pg, limit };
      const result = await auditApi.getEntries(params);
      setEntries(result.entries);
      setTotal(result.total);
      setPage(result.page);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries(appliedFilters, page);
  }, [appliedFilters, page]);

  function handleSearch() {
    const filters: Record<string, string | number | undefined> = {};
    if (action) filters.action = action;
    if (resourceType) filters.resource_type = resourceType;
    if (dateStart) filters.date_start = dateStart;
    if (dateEnd) filters.date_end = dateEnd;
    if (search) filters.search = search;
    setAppliedFilters(filters);
    setPage(1);
  }

  function handleClear() {
    setAction('');
    setResourceType('');
    setDateStart('');
    setDateEnd('');
    setSearch('');
    setAppliedFilters({});
    setPage(1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div className="card">
      <div className="toolbar flex gap-sm items-center mb-md" style={{ flexWrap: 'wrap' }}>
        <select
          className="form-input"
          value={action}
          onChange={e => setAction(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="">All Actions</option>
          {ACTION_OPTIONS.filter(Boolean).map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <input
          className="form-input"
          type="text"
          placeholder="Resource type"
          value={resourceType}
          onChange={e => setResourceType(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ width: '140px' }}
        />

        <input
          className="form-input"
          type="date"
          value={dateStart}
          onChange={e => setDateStart(e.target.value)}
          title="Start date"
        />

        <input
          className="form-input"
          type="date"
          value={dateEnd}
          onChange={e => setDateEnd(e.target.value)}
          title="End date"
        />

        <input
          className="form-input"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ width: '160px' }}
        />

        <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
        <button className="btn btn-secondary btn-sm" onClick={handleClear}>Clear</button>
      </div>

      {error && <div className="text-sm" style={{ color: 'var(--color-danger, red)', marginBottom: '8px' }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource Type</th>
              <th>Resource ID</th>
              <th>Details</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-sm text-muted" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={7} className="text-sm text-muted" style={{ textAlign: 'center', padding: '24px' }}>No audit log entries found</td></tr>
            ) : (
              entries.map(entry => (
                <tr key={entry.id}>
                  <td className="text-sm">{formatDate(entry.created_at)}</td>
                  <td>{entry.user_id ?? <span className="text-muted">-</span>}</td>
                  <td><ActionBadge action={entry.action} /></td>
                  <td>{entry.resource_type}</td>
                  <td className="text-sm">{entry.resource_id ?? <span className="text-muted">-</span>}</td>
                  <td className="text-sm">
                    {entry.details ? (
                      <span
                        className="btn-ghost"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        title="Click to expand"
                      >
                        {expandedId === entry.id ? detailsText(entry.details) : truncate(detailsText(entry.details), 80)}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="text-sm text-muted">{entry.ip_address ?? '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between" style={{ marginTop: '12px' }}>
          <span className="text-sm text-muted">{total} total entries</span>
          <div className="flex gap-sm items-center">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
