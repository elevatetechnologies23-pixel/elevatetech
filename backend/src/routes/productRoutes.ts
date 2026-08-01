import { Router } from 'express';
import { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  createProductReview,
  getProductReviews,
  getPublicTestimonials,
  getAdminTestimonials,
  createAdminTestimonial,
  updateAdminTestimonial,
  deleteAdminTestimonial
} from '../controllers/productController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/testimonials/public', getPublicTestimonials);
router.get('/:id', getProductById);
router.get('/:id/reviews', getProductReviews);

// Admin Testimonial routes
router.get('/testimonials/admin-list', protect, restrictTo('admin', 'employee'), getAdminTestimonials);
router.post('/testimonials', protect, restrictTo('admin'), createAdminTestimonial);
router.put('/testimonials/:id', protect, restrictTo('admin'), updateAdminTestimonial);
router.delete('/testimonials/:id', protect, restrictTo('admin'), deleteAdminTestimonial);

// Protected routes (Admin & Employee write actions)
router.post('/', protect, restrictTo('admin', 'employee'), createProduct);
router.put('/:id', protect, restrictTo('admin', 'employee'), updateProduct);
router.delete('/:id', protect, restrictTo('admin', 'employee'), deleteProduct);

router.post('/categories', protect, restrictTo('admin', 'employee'), createCategory);
router.put('/categories/:id', protect, restrictTo('admin', 'employee'), updateCategory);
router.delete('/categories/:id', protect, restrictTo('admin', 'employee'), deleteCategory);

router.post('/brands', protect, restrictTo('admin', 'employee'), createBrand);
router.put('/brands/:id', protect, restrictTo('admin', 'employee'), updateBrand);
router.delete('/brands/:id', protect, restrictTo('admin', 'employee'), deleteBrand);

// Customer protected routes (Add reviews)
router.post('/:id/reviews', protect, createProductReview);

export default router;
