import { Router } from 'express';
import { getDashboardSummary } from '../controllers/admin.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard/summary', authenticate as any, authorizeAdmin as any, getDashboardSummary as any);

export default router;
