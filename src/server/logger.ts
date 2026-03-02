import type { Request, Response, NextFunction } from 'express';
import type { AuditDB } from './db/interface.js';

export class AuditLogger {
  constructor(private db: AuditDB) {}

  log(userId: number | null, action: string, resourceType: string, resourceId?: string | null, details?: any) {
    const detailsStr = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null;
    return this.db.log(userId, action, resourceType, resourceId ?? null, detailsStr);
  }

  createAutoLogMiddleware() {
    return (req: any, res: Response, next: NextFunction) => {
      // Only log write operations
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        return next();
      }

      // Log after response completes
      res.on('finish', () => {
        // Only log successful responses
        if (res.statusCode < 200 || res.statusCode >= 300) return;

        const userId = req.user?.id ?? null;
        const action = req.method;
        // Extract resource type from the base path segment
        const pathParts = req.path.split('/').filter(Boolean);
        const resourceType = pathParts[0] || 'unknown';
        const resourceId = req.params?.id || pathParts[1] || null;
        const ipAddress = req.ip || req.connection?.remoteAddress || null;

        try {
          this.db.log(userId, action, resourceType, resourceId, null, ipAddress);
        } catch {
          // Don't let audit logging break the app
        }
      });

      next();
    };
  }
}
