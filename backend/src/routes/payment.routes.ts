import { Router } from 'express';
import { createRazorpayOrder, verifyPayment } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/create', authenticate as any, createRazorpayOrder as any);
router.post('/verify', authenticate as any, verifyPayment as any);

export default router;
