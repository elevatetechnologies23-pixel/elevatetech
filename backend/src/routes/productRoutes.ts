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

// -------------------------------------------------------
// STATIC / NAMED ROUTES — must come BEFORE /:id wildcard
// -------------------------------------------------------

// Categories
router.get('/categories', getCategories);
router.post('/categories', protect, restrictTo('admin', 'employee'), createCategory);
router.put('/categories/:id', protect, restrictTo('admin', 'employee'), updateCategory);
router.delete('/categories/:id', protect, restrictTo('admin', 'employee'), deleteCategory);

// Brands
router.get('/brands', getBrands);
router.post('/brands', protect, restrictTo('admin', 'employee'), createBrand);
router.put('/brands/:id', protect, restrictTo('admin', 'employee'), updateBrand);
router.delete('/brands/:id', protect, restrictTo('admin', 'employee'), deleteBrand);

// Testimonials
router.get('/testimonials/public', getPublicTestimonials);
router.get('/testimonials/admin-list', protect, restrictTo('admin', 'employee'), getAdminTestimonials);
router.post('/testimonials', protect, restrictTo('admin'), createAdminTestimonial);
router.put('/testimonials/:id', protect, restrictTo('admin'), updateAdminTestimonial);
router.delete('/testimonials/:id', protect, restrictTo('admin'), deleteAdminTestimonial);

// -------------------------------------------------------
// PRODUCT CRUD — wildcard /:id goes LAST
// -------------------------------------------------------

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/:id/reviews', getProductReviews);

// Protected write actions
router.post('/', protect, restrictTo('admin', 'employee'), createProduct);
router.put('/:id', protect, restrictTo('admin', 'employee'), updateProduct);
router.delete('/:id', protect, restrictTo('admin', 'employee'), deleteProduct);

// Customer — add review
router.post('/:id/reviews', protect, createProductReview);

export default router;
