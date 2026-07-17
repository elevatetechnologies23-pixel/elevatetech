import { Router } from 'express';
import { 
  validateLicense, 
  getMyLicenses, 
  getAdminLicenses, 
  updateLicenseStatus,
  deactivateMacAddress
} from '../controllers/licenseController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Public / Client API Endpoint for Billing Software activation checks
router.post('/activate', validateLicense);

// Customer portal routes
router.get('/my-licenses', protect, getMyLicenses);
router.put('/:id/deactivate-mac', protect, deactivateMacAddress);

// Admin dashboard routes
router.get('/admin-list', protect, restrictTo('admin'), getAdminLicenses);
router.put('/:id/status', protect, restrictTo('admin'), updateLicenseStatus);

export default router;
