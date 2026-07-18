import { Router } from 'express';
import { 
  createOrder, 
  getMyOrders, 
  getOrderDetails, 
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getAdminOrders,
  downloadInvoice,
  validateCoupon
} from '../controllers/orderController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Customer protected routes
router.post('/', protect, createOrder);
router.post('/validate-coupon', protect, validateCoupon);
router.get('/my-orders', protect, getMyOrders);
router.get('/details/:orderNumber', protect, getOrderDetails);
router.put('/:id/cancel', protect, cancelOrder);
router.get('/invoice/:orderNumber/download', protect, downloadInvoice);

// Admin/Employee dashboard routes
router.get('/admin-queue', protect, restrictTo('admin', 'employee'), getAdminOrders);
router.put('/:id/status', protect, restrictTo('admin'), updateOrderStatus);
router.put('/:id/payment-status', protect, restrictTo('admin'), updatePaymentStatus);

export default router;
