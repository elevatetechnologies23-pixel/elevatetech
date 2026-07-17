import { Router } from 'express';
import { 
  getDashboardStats, 
  getAuditLogs, 
  getEmployees, 
  getUsers,
  updateEmployeeRole,
  getSystemSettings,
  updateSystemSettings
} from '../controllers/adminController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Admin / Employee shared routes (view stats)
router.get('/stats', protect, restrictTo('admin', 'employee'), getDashboardStats);

// Admin-only operations
router.get('/logs', protect, restrictTo('admin'), getAuditLogs);
router.get('/employees', protect, restrictTo('admin'), getEmployees);
router.put('/employees/:id/role', protect, restrictTo('admin'), updateEmployeeRole);
router.get('/users', protect, restrictTo('admin'), getUsers);
router.put('/users/:id/role', protect, restrictTo('admin'), updateEmployeeRole);

// System Settings routes
router.get('/settings', protect, getSystemSettings);
router.post('/settings', protect, restrictTo('admin'), updateSystemSettings);

export default router;
