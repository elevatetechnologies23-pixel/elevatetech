import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { removeFromWishlist, clearWishlist } from '../store/wishlistSlice';
import { addToCart } from '../store/cartSlice';
import { useToast } from '../utils/ToastContext';
import { X, ShoppingCart, Trash2, Heart } from 'lucide-react';
import type { ProductItem } from '../utils/mockData';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);

  if (!isOpen) return null;

  const handleMoveToCart = (e: React.MouseEvent, prod: ProductItem) => {
    e.stopPropagation();
    const prodId = prod.id || (prod as any)._id;
    dispatch(addToCart({
      id: prodId,
      name: prod.name,
      price: prod.basePrice,
      image: prod.images[0],
      category: typeof prod.category === 'object' && prod.category ? (prod.category as any).name : prod.category,
      gstPercentage: prod.gstPercentage,
      quantity: 1,
      stock: prod.stock
    }));
    dispatch(removeFromWishlist(prodId));
    toast.cart('Added to Cart!', `${prod.name} has been moved to your cart.`);
  };

  const handleRemove = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    dispatch(removeFromWishlist(id));
    toast.success('Removed from Wishlist', `${name} has been removed.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        {/* Dark overlay backdrop */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        ></div>

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md animate-fade-in">
            <div className="flex h-full flex-col bg-white dark:bg-primary-700 shadow-2xl border-l border-slate-100 dark:border-primary-500/25">

              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-primary-500/30 flex items-center justify-between">
                <h2 className="text-sm font-extrabold flex items-center gap-2 text-primary-500 dark:text-primary-50">
                  <Heart size={16} className="fill-red-500 text-red-500 animate-pulse" /> My Wishlist ({wishlistItems.length})
                </h2>
                <div className="flex items-center gap-4">
                  {wishlistItems.length > 0 && (
                    <button
                      onClick={() => {
                        dispatch(clearWishlist());
                        toast.success('Wishlist Cleared', 'All favorited items have been removed.');
                      }}
                      className="text-[10px] text-red-500 font-bold hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-primary-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {wishlistItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <Heart size={32} className="text-slate-300 dark:text-primary-500" />
                    <p className="text-xs font-bold text-slate-400">Your wishlist is empty</p>
                    <p className="text-[10px] text-slate-400 max-w-[200px]">Save items to your favorites to see them here.</p>
                  </div>
                ) : (
                  wishlistItems.map((item) => {
                    const itemId = item.id || (item as any)._id;
                    const brandName = typeof item.brand === 'object' && item.brand ? (item.brand as any).name : item.brand;
                    return (
                      <div key={itemId} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-primary-600/40 border border-slate-100 dark:border-primary-500/10 hover:shadow-sm transition-all">
                        <div className="w-16 h-16 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-200/50 flex items-center justify-center">
                          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5 text-left text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{brandName}</span>
                            <span className="font-extrabold text-[13px] leading-tight block text-primary-500 dark:text-primary-50 truncate">{item.name}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1.5">
                            <span className="font-extrabold text-accent-blue">INR {item.basePrice.toLocaleString('en-IN')}</span>
                            <div className="flex gap-2.5">
                              <button
                                onClick={(e) => handleMoveToCart(e, item)}
                                className="text-accent-blue font-bold hover:underline flex items-center gap-1 text-[10px]"
                                title="Move to Cart"
                              >
                                <ShoppingCart size={12} /> Add to Cart
                              </button>
                              <button
                                onClick={(e) => handleRemove(e, itemId, item.name)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Remove"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistDrawer;
