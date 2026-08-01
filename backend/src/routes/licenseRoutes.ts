import { Router } from 'express';
import { 
  validateLicense, 
  getMyLicenses, 
  getAdminLicenses, 
  updateLicenseStatus,
  deactivateMacAddress,
  createLicense,
  updateLicense,
  deleteLicense
} from '../controllers/licenseController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Public / Client API Endpoint for Billing Software activation checks
router.post('/activate', validateLicense);

// Customer portal routes
router.get('/my-licenses', protect, getMyLicenses);
router.put('/:id/deactivate-mac', protect, deactivateMacAddress);

// Admin dashboard routes
router.get('/admin-list', protect, restrictTo('admin', 'employee'), getAdminLicenses);
router.post('/create', protect, restrictTo('admin', 'employee'), createLicense);
router.put('/:id/status', protect, restrictTo('admin', 'employee'), updateLicenseStatus);
router.put('/:id', protect, restrictTo('admin', 'employee'), updateLicense);
router.delete('/:id', protect, restrictTo('admin', 'employee'), deleteLicense);

export default router;
