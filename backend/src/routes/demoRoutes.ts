import { Router } from 'express';
import { 
  bookDemo, 
  getAdminDemos, 
  updateDemoStatus, 
  deleteDemo 
} from '../controllers/demoController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Public: Book a live demo
router.post('/book', bookDemo);

// Admin-only management routes
router.get('/admin-list', protect, restrictTo('admin', 'employee'), getAdminDemos);
router.put('/:id', protect, restrictTo('admin', 'employee'), updateDemoStatus);
router.delete('/:id', protect, restrictTo('admin'), deleteDemo);

export default router;
