import { Router } from 'express';
import { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getCategories,
  createCategory,
  getBrands,
  createBrand,
  createProductReview,
  getProductReviews
} from '../controllers/productController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/:id', getProductById);
router.get('/:id/reviews', getProductReviews);

// Protected routes (Admin write actions only)
router.post('/', protect, restrictTo('admin'), createProduct);
router.put('/:id', protect, restrictTo('admin'), updateProduct);
router.delete('/:id', protect, restrictTo('admin'), deleteProduct);

router.post('/categories', protect, restrictTo('admin'), createCategory);
router.post('/brands', protect, restrictTo('admin'), createBrand);

// Customer protected routes (Add reviews)
router.post('/:id/reviews', protect, createProductReview);

export default router;
