import { Router } from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/product.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getProducts as any);
router.get('/:id', getProductById as any);

// Admin only routes
router.post('/', authenticate as any, authorizeAdmin as any, createProduct as any);
router.put('/:id', authenticate as any, authorizeAdmin as any, updateProduct as any);
router.delete('/:id', authenticate as any, authorizeAdmin as any, deleteProduct as any);

export default router;
