# audit-log-kit

Reusable audit logging system with admin viewer for Express + React + TypeScript apps. Provides server-side logging with automatic middleware, query/filter API, and a React admin component.

## Server Integration

```typescript
import express from 'express';
import { Database } from 'bun:sqlite';
import { setupAuditLog, SqliteAuditDB } from 'audit-log-kit/server';

const app = express();
const db = new Database('app.db');
const auditDB = new SqliteAuditDB(db);

const { router, logger } = setupAuditLog(app, {
  db: auditDB,
  autoLog: true, // auto-log POST/PUT/PATCH/DELETE requests
});

// Mount the audit log query API
app.use('/api/audit-log', router);

// Manual logging
logger.log(userId, 'user.login', 'auth', null, { method: 'password' });
logger.log(userId, 'record.create', 'invoice', invoiceId, { amount: 500 });
```

## Auto-Log Middleware

When `autoLog: true`, the middleware automatically logs write operations (POST, PUT, PATCH, DELETE) after successful responses (2xx). It captures:

- **User ID** from `req.user.id`
- **Action** from `req.method`
- **Resource type** from the first URL path segment
- **Resource ID** from `req.params.id` or the second path segment
- **IP address** from `req.ip`

## Client Integration

```tsx
import { AuditLogViewer } from 'audit-log-kit/client';

function AdminPage() {
  return (
    <div>
      <h1>Audit Log</h1>
      <AuditLogViewer />
    </div>
  );
}
```

The `AuditLogViewer` component provides:
- Filter bar with action, resource type, date range, and search inputs
- Paginated table with time, user, action, resource, details, and IP columns
- Expandable details column for long JSON content
- Uses design-kit CSS classes (`.card`, `.table`, `.btn`, `.form-input`, `.badge`, etc.)

## Query API

```
GET /api/audit-log?user_id=1&action=POST&resource_type=invoice&date_start=2025-01-01&date_end=2025-12-31&search=keyword&page=1&limit=50
```

Returns `{ entries: AuditEntry[], total: number, page: number, limit: number }`.

## Database Adapters

- **SQLite** (Bun): `SqliteAuditDB` - included, uses `bun:sqlite` with synchronous operations
- **PostgreSQL**: Schema provided in `src/server/db/schema.pg.sql` - implement `AuditDB` interface for your PG client

## Custom Database Adapter

Implement the `AuditDB` interface:

```typescript
import type { AuditDB } from 'audit-log-kit/server';

class MyAuditDB implements AuditDB {
  initSchema(): void { /* create tables */ }
  log(userId, action, resourceType, resourceId?, details?, ipAddress?): void { /* insert */ }
  query(options?): AuditQueryResult { /* select with filters */ }
}
```
