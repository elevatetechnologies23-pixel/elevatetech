import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ProductItem } from '../utils/mockData';
import api from '../services/api';
import { 
  Star, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  Sparkles,
  Send,
  User as UserIcon
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import type { RootState } from '../store';
import { useToast } from '../utils/ToastContext';
import { addToWishlist, removeFromWishlist } from '../store/wishlistSlice';
import { Heart } from 'lucide-react';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const wishlist = useSelector((state: RootState) => state.wishlist.items);
  const toast = useToast();

  // States
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  
  // Review inputs
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const isInWishlist = product ? wishlist.some(item => (item.id || (item as any)._id) === (product.id || (product as any)._id)) : false;

  const toggleWishlist = () => {
    if (!product) return;
    const prodId = product.id || (product as any)._id;
    if (isInWishlist) {
      dispatch(removeFromWishlist(prodId));
      toast.success('Removed from Wishlist', `${product.name} has been removed.`);
    } else {
      dispatch(addToWishlist(product));
      toast.success('Added to Wishlist', `${product.name} has been added to your favorites.`);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data?.data) {
          const { product: prod, relatedProducts: rel } = res.data.data;
          setProduct(prod);
          setRelatedProducts(rel);
          setActiveImage(prod.images[0] || '');
        }
      } catch (err) {
        console.warn('Product not found or API error:', err);
        setProduct(null);
        setActiveImage('');
        setRelatedProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Fetch reviews separate or mock
  useEffect(() => {
    if (!product) return;
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/products/${product.id || id}/reviews`);
        if (res.data?.data) {
          setReviews(res.data.data);
        }
      } catch {
        setReviews([
          { user: { name: 'IT Admin Office' }, rating: 5, comment: 'Highly recommended for office usage. Fast performance.', createdAt: new Date().toISOString() },
          { user: { name: 'K. S. Sharma' }, rating: 4, comment: 'Solid build quality. Standard delivery took 3 days.', createdAt: new Date().toISOString() }
        ]);
      }
    };
    fetchReviews();
  }, [product, id]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addToCart({
      id: product.id || (product as any)._id,
      name: product.name,
      price: product.basePrice,
      image: product.images[0],
      category: typeof product.category === 'object' && product.category ? (product.category as any).name : product.category,
      gstPercentage: product.gstPercentage,
      quantity: 1,
      stock: product.stock
    }));
    toast.cart('Added to Cart!', `${product.name} has been added to your cart.`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/products/${product?.id || id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewSuccess(true);
      setReviewComment('');
      toast.success('Review Submitted!', 'Thank you for your feedback.');
      // Reload reviews
      const res = await api.get(`/products/${product?.id || id}/reviews`);
      if (res.data?.data) setReviews(res.data.data);
    } catch (err: any) {
      toast.error('Review Failed', err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Product not found.</p>
      </div>
    );
  }

  // Compute total with GST
  const gstAmt = product.basePrice * (product.gstPercentage / 100);
  const priceInclGst = product.basePrice + gstAmt;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      
      {/* 1. Product Brief details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="h-96 bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-primary-500/20">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-4">
              {product.images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 bg-slate-100 rounded-xl overflow-hidden border-2 ${activeImage === img ? 'border-accent-blue' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Configurations Box */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">{typeof product.brand === 'object' && product.brand ? (product.brand as any).name : product.brand}</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary-500 dark:text-primary-50 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4 text-sm pt-1">
              <div className="flex items-center text-yellow-500">
                {[1,2,3,4,5].map(star => (
                  <Star 
                    key={star} 
                    size={14} 
                    className={star <= Math.round(product.ratingsAverage) ? 'fill-current' : 'text-slate-200'} 
                  />
                ))}
                <span className="font-semibold ml-1.5">{product.ratingsAverage}</span>
              </div>
              <span className="text-slate-300 dark:text-primary-500">|</span>
              <span className="text-slate-400">{reviews.length} Customer Reviews</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 dark:text-slate-300 leading-relaxed">
            {product.description}
          </p>

          <hr className="border-slate-100 dark:border-primary-500" />

          {/* Pricing with GST Split */}
          <div className="bg-slate-100/50 dark:bg-primary-700/50 p-6 rounded-2xl space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Base Price (Excl. GST)</span>
              <span className="font-semibold text-sm">INR {product.basePrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-baseline text-xs text-slate-400 border-b border-dashed border-slate-200 dark:border-primary-500 pb-2">
              <span>GST ({product.gstPercentage}%)</span>
              <span>+INR {gstAmt.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="font-semibold text-xs">Total Price (Incl. GST)</span>
              <span className="font-extrabold text-xl text-accent-blue">
                INR {priceInclGst.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Warranty & Accessories info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck size={16} className="text-accent-blue" />
              <span>{product.warrantyMonths || 12} Months Warranty</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Truck size={16} className="text-accent-blue" />
              <span>Free Delivery in 3 Days</span>
            </div>
            <div className="col-span-2 text-slate-400">
              <span className="font-bold">Model Number:</span> {product.modelNumber} | <span className="font-bold">SKU:</span> {product.sku}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button 
              onClick={toggleWishlist}
              className={`p-3.5 rounded-xl border flex items-center justify-center transition-all hover:scale-105 ${isInWishlist ? 'border-red-200 bg-red-500/10 text-red-500 shadow-sm' : 'border-slate-200 dark:border-primary-500 text-slate-400 hover:text-red-500'}`}
              title="Add to Wishlist"
            >
              <Heart size={18} className={isInWishlist ? 'fill-current' : ''} />
            </button>
            <button 
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-secondary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-primary-500"
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
            <button 
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* 2. Technical Specifications Table */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-b border-slate-100 dark:border-primary-500 pb-2">Technical Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-slate-100 dark:border-primary-500 rounded-2xl overflow-hidden shadow-inner">
            <table className="w-full text-xs text-left">
              <tbody>
                {product.specifications.map((spec, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-primary-500 last:border-none">
                    <td className="px-6 py-4 bg-slate-50 dark:bg-primary-700/50 font-bold text-slate-400 w-1/3">{spec.name}</td>
                    <td className="px-6 py-4 font-semibold">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Sparkles size={16} className="text-accent-gold" /> Accessories Included
            </h3>
            <ul className="text-xs text-slate-400 dark:text-slate-300 space-y-2 list-disc list-inside">
              {product.accessoriesIncluded && product.accessoriesIncluded.length > 0 ? (
                product.accessoriesIncluded.map((acc: string, i: number) => <li key={i}>{acc}</li>)
              ) : (
                <>
                  <li>Power Adapter & Cable</li>
                  <li>User Manual & Warranty Booklet</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Customer Reviews Section */}
      <section className="space-y-8">
        <h2 className="text-xl font-bold border-b border-slate-100 dark:border-primary-500 pb-2">Customer Reviews & Ratings</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No reviews yet for this product. Be the first to share your experience!</p>
            ) : (
              reviews.map((rev, idx) => (
                <div key={idx} className="glass-card p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-primary-500 flex items-center justify-center font-bold text-xs">
                        <UserIcon size={14} className="text-slate-400" />
                      </div>
                      <div>
                        <span className="font-bold text-xs">{rev.user?.name || 'Anonymous User'}</span>
                        <span className="text-[10px] text-slate-400 block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex text-yellow-500">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} size={12} className={star <= rev.rating ? 'fill-current' : 'text-slate-200'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Add Review Form */}
          <div>
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-sm">Write a Product Review</h3>
              {reviewSuccess ? (
                <div className="p-4 bg-green-500/10 text-green-500 rounded-xl text-xs font-semibold">
                  Review submitted successfully! Thank you for your feedback.
                </div>
              ) : isAuthenticated ? (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">Rating</span>
                    <div className="flex gap-2 text-yellow-500 cursor-pointer">
                      {[1,2,3,4,5].map(star => (
                        <Star 
                          key={star} 
                          size={18} 
                          onClick={() => setReviewRating(star)} 
                          className={star <= reviewRating ? 'fill-current' : 'text-slate-200 dark:text-primary-500'} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">Comment</span>
                    <textarea 
                      placeholder="What did you think of this product?"
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      className="input-field text-xs resize-none"
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full text-xs font-semibold py-2">
                    <Send size={14} /> Submit Review
                  </button>
                </form>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-slate-400">Please sign in to write product reviews.</p>
                  <button onClick={() => navigate('/login')} className="btn-secondary py-1.5 px-4 text-xs font-semibold w-full">
                    Log In
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 4. Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-b border-slate-100 dark:border-primary-500 pb-2">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedProducts.map((prod) => (
              <div 
                key={prod.id}
                onClick={() => navigate(`/product/${prod.id}`)}
                className="glass-card p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="h-32 bg-slate-100 rounded-xl overflow-hidden">
                  <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-xs truncate text-primary-500 dark:text-primary-50">{prod.name}</h3>
                <div className="flex justify-between items-baseline">
                  <span className="font-extrabold text-xs">INR {prod.basePrice.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-400">Excl. GST</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default ProductDetails;
