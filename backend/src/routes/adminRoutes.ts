import { Router } from 'express';
import { 
  getDashboardStats, 
  getAuditLogs, 
  getEmployees, 
  createEmployee,
  updateEmployeeRole,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getSystemSettings,
  updateSystemSettings,
  getPublicSettings,
  deleteAuditLog,
  clearAllAuditLogs,
  clearOldAuditLogs
} from '../controllers/adminController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Public Settings route (unauthenticated)
router.get('/settings/public', getPublicSettings);

// Admin / Employee shared routes (view stats)
router.get('/stats', protect, restrictTo('admin', 'employee'), getDashboardStats);

// Admin-only operations & Audit log management
router.get('/logs', protect, restrictTo('admin'), getAuditLogs);
router.delete('/logs/clear-all', protect, restrictTo('admin'), clearAllAuditLogs);
router.delete('/logs/clear-old', protect, restrictTo('admin'), clearOldAuditLogs);
router.delete('/logs/:id', protect, restrictTo('admin'), deleteAuditLog);

// Staff management
router.get('/employees', protect, restrictTo('admin'), getEmployees);
router.post('/employees', protect, restrictTo('admin'), createEmployee);
router.put('/employees/:id/role', protect, restrictTo('admin'), updateEmployeeRole);
router.put('/employees/:id', protect, restrictTo('admin'), updateUser);
router.delete('/employees/:id', protect, restrictTo('admin'), deleteUser);

// User management
router.get('/users', protect, restrictTo('admin'), getUsers);
router.post('/users', protect, restrictTo('admin'), createUser);
router.put('/users/:id/role', protect, restrictTo('admin'), updateEmployeeRole);
router.put('/users/:id', protect, restrictTo('admin'), updateUser);
router.delete('/users/:id', protect, restrictTo('admin'), deleteUser);

// System Settings routes
router.get('/settings', protect, getSystemSettings);
router.post('/settings', protect, restrictTo('admin'), updateSystemSettings);

export default router;
