import { Router } from 'express';
import { getNotifications, markAllRead, markOneRead } from '../controllers/notificationController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// All routes require admin or employee
router.use(protect, restrictTo('admin', 'employee'));

router.get('/', getNotifications);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markOneRead);

export default router;
