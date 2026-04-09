import { Router } from 'express';
import { 
  createOrder, 
  getMyOrders, 
  getAllOrders, 
  updateOrderStatus 
} from '../controllers/order.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// User routes
router.post('/', authenticate as any, createOrder as any);
router.get('/my-orders', authenticate as any, getMyOrders as any);

// Admin routes
router.get('/', authenticate as any, authorizeAdmin as any, getAllOrders as any);
router.patch('/:id/status', authenticate as any, authorizeAdmin as any, updateOrderStatus as any);

export default router;
