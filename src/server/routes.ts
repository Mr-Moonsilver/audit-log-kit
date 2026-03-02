import { Router, Response } from 'express';
import type { AuditDB } from './db/interface.js';

export function createAuditRouter(db: AuditDB): Router {
  const router = Router();

  router.get('/', async (req: any, res: Response) => {
    const { user_id, action, resource_type, date_start, date_end, search, page, limit } = req.query;

    const result = await db.query({
      userId: user_id ? Number(user_id) : undefined,
      action: action as string | undefined,
      resourceType: resource_type as string | undefined,
      dateStart: date_start as string | undefined,
      dateEnd: date_end as string | undefined,
      search: search as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json(result);
  });

  return router;
}
