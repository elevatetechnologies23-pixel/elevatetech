import { Router } from 'express';
import { 
  getPublicBanners, 
  getAdminBanners, 
  createBanner, 
  updateBanner, 
  deleteBanner 
} from '../controllers/bannerController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Public route for customer homepage
router.get('/', getPublicBanners);

// Admin dashboard routes
router.get('/admin-list', protect, restrictTo('admin', 'employee'), getAdminBanners);
router.post('/', protect, restrictTo('admin', 'employee'), createBanner);
router.put('/:id', protect, restrictTo('admin', 'employee'), updateBanner);
router.delete('/:id', protect, restrictTo('admin', 'employee'), deleteBanner);

export default router;
