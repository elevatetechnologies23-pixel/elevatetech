import { Router } from 'express';
import { getNotifications, markAllRead, markOneRead, streamNotifications } from '../controllers/notificationController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// All routes require admin, employee, or customer
router.use(protect, restrictTo('admin', 'employee', 'customer'));

router.get('/', getNotifications);
router.get('/stream', streamNotifications);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markOneRead);

export default router;
