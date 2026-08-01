import { Router } from 'express';
import {
  getPublicVideos,
  getAdminVideos,
  createVideo,
  updateVideo,
  deleteVideo
} from '../controllers/videoController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/', getPublicVideos);

// Protected Admin/Staff routes
router.get('/admin-list', protect, restrictTo('admin', 'employee'), getAdminVideos);
router.post('/', protect, restrictTo('admin'), createVideo);
router.put('/:id', protect, restrictTo('admin'), updateVideo);
router.delete('/:id', protect, restrictTo('admin'), deleteVideo);

export default router;
