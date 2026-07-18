import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../utils/mockData';
import type { ProductItem } from '../utils/mockData';
import api from '../services/api';
import { 
  Star, 
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import type { RootState } from '../store';
import { addToWishlist, removeFromWishlist } from '../store/wishlistSlice';
import { useToast } from '../utils/ToastContext';
import { Heart } from 'lucide-react';

const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // States
  const wishlist = useSelector((state: RootState) => state.wishlist.items);
  const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [dbCategories, setDbCategories] = useState<{ _id: string; name: string }[]>([]);
  const [dbBrands, setDbBrands] = useState<{ _id: string; name: string }[]>([]);

  const DEFAULT_CATEGORIES = ['Laptop', 'CCTV Camera', 'Billing Software', 'Networking', 'Printer', 'RAM'];
  const DEFAULT_BRANDS = ['Lenovo', 'Hikvision', 'Cisco', 'HP', 'Corsair', 'EnterpriseSoft'];

  const getCategoryOptions = () => {
    const list = [...dbCategories.map(c => c.name)];
    DEFAULT_CATEGORIES.forEach(name => {
      if (!list.includes(name)) list.push(name);
    });
    return list;
  };

  const getBrandOptions = () => {
    const list = [...dbBrands.map(b => b.name)];
    DEFAULT_BRANDS.forEach(name => {
      if (!list.includes(name)) list.push(name);
    });
    return list;
  };

  // Fetch categories and brands from database on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/products/categories'),
          api.get('/products/brands')
        ]);
        if (catRes.data?.data) {
          setDbCategories(catRes.data.data);
        }
        if (brandRes.data?.data) {
          setDbBrands(brandRes.data.data);
        }
      } catch (err) {
        console.warn('Failed to load categories or brands from API, using defaults');
      }
    };
    loadFilters();
  }, []);

  const isInWishlist = (id: string) => wishlist.some(item => (item.id || (item as any)._id) === id);

  const toggleWishlist = (e: React.MouseEvent, prod: ProductItem) => {
    e.stopPropagation();
    const prodId = prod.id || (prod as any)._id;
    if (isInWishlist(prodId)) {
      dispatch(removeFromWishlist(prodId));
      toast.success('Removed from Wishlist', `${prod.name} has been removed.`);
    } else {
      dispatch(addToWishlist(prod));
      toast.success('Added to Wishlist', `${prod.name} has been added to your favorites.`);
    }
  };
  
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  
  // Specific specs filters
  const [specProcessor, setSpecProcessor] = useState('');
  const [specRAM, setSpecRAM] = useState('');
  const [specSSD, setSpecSSD] = useState('');
  const [specOS, setSpecOS] = useState('');

  // Sync category param from URL
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat !== null) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Fetch products from backend or fallback to local filters
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.append('category', selectedCategory);
        if (selectedBrand) queryParams.append('brand', selectedBrand);
        if (minPrice) queryParams.append('minPrice', minPrice);
        if (maxPrice) queryParams.append('maxPrice', maxPrice);
        if (sortOption) queryParams.append('sort', sortOption);
        
        // specs
        if (specProcessor) queryParams.append('processor', specProcessor);
        if (specRAM) queryParams.append('ram', specRAM);
        if (specSSD) queryParams.append('ssd', specSSD);
        if (specOS) queryParams.append('os', specOS);

        const search = searchParams.get('q');
        if (search) queryParams.append('search', search);

        const res = await api.get(`/products?${queryParams.toString()}`);
        if (res.data?.data) {
          setProducts(res.data.data);
        }
      } catch (err: any) {
        console.warn('Backend connection failed, using offline fallback filtering:', err.message);
        // Fallback local filtering logic
        let filtered = [...MOCK_PRODUCTS];

        // Search text
        const q = searchParams.get('q');
        if (q) {
          const regex = new RegExp(q, 'i');
          filtered = filtered.filter(p => 
            p.name.match(regex) || 
            p.sku.match(regex) || 
            p.description.match(regex)
          );
        }

        // Category
        if (selectedCategory) {
          filtered = filtered.filter(p => p.category === selectedCategory);
        }

        // Brand
        if (selectedBrand) {
          filtered = filtered.filter(p => p.brand === selectedBrand);
        }

        // Price range
        if (minPrice) {
          filtered = filtered.filter(p => p.basePrice >= Number(minPrice));
        }
        if (maxPrice) {
          filtered = filtered.filter(p => p.basePrice <= Number(maxPrice));
        }

        // Specs
        if (specProcessor) {
          filtered = filtered.filter(p => p.specifications.some(s => s.name === 'Processor' && s.value.toLowerCase().includes(specProcessor.toLowerCase())));
        }
        if (specRAM) {
          filtered = filtered.filter(p => p.specifications.some(s => s.name === 'RAM' && s.value.toLowerCase().includes(specRAM.toLowerCase())));
        }
        if (specSSD) {
          filtered = filtered.filter(p => p.specifications.some(s => s.name === 'SSD' && s.value.toLowerCase().includes(specSSD.toLowerCase())));
        }
        if (specOS) {
          filtered = filtered.filter(p => p.specifications.some(s => s.name === 'Operating System' && s.value.toLowerCase().includes(specOS.toLowerCase())));
        }

        // Sorting
        if (sortOption === 'price-asc') {
          filtered.sort((a, b) => a.basePrice - b.basePrice);
        } else if (sortOption === 'price-desc') {
          filtered.sort((a, b) => b.basePrice - a.basePrice);
        } else if (sortOption === 'rating') {
          filtered.sort((a, b) => b.ratingsAverage - a.ratingsAverage);
        }

        setProducts(filtered);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [
    selectedCategory, 
    selectedBrand, 
    minPrice, 
    maxPrice, 
    sortOption, 
    specProcessor, 
    specRAM, 
    specSSD, 
    specOS,
    searchParams
  ]);

  const handleAddToCart = (e: React.MouseEvent, prod: ProductItem) => {
    e.stopPropagation();
    const prodId = prod.id || (prod as any)._id;
    dispatch(addToCart({
      id: prodId,
      name: prod.name,
      price: prod.basePrice,
      image: prod.images[0],
      category: prod.category,
      gstPercentage: prod.gstPercentage,
      quantity: 1,
      stock: prod.stock
    }));
  };

  const handleClearAllFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSpecProcessor('');
    setSpecRAM('');
    setSpecSSD('');
    setSpecOS('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Catalog</h2>
          {searchParams.get('q') && (
            <p className="text-sm text-slate-400 mt-1">
              Search results for "<span className="text-accent-blue font-semibold">{searchParams.get('q')}</span>"
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-400">Sort by</span>
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-primary-700 text-xs rounded-xl outline-none border border-slate-200 dark:border-primary-500 font-semibold"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Average Ratings</option>
          </select>
        </div>
      </div>

      {/* Mobile/Tablet Filter Toggle Bar */}
      <div className="lg:hidden flex justify-between items-center bg-white dark:bg-primary-700/50 border border-slate-100 dark:border-primary-500 rounded-2xl px-4 py-3.5 mb-2.5">
        <button 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-200 transition-colors"
        >
          <SlidersHorizontal size={14} /> 
          {showMobileFilters ? 'Hide Filters & Parameters' : 'Show Filters & Parameters'}
        </button>
        {(selectedCategory || selectedBrand || minPrice || maxPrice || specProcessor || specRAM || specSSD || specOS) && (
          <button 
            onClick={handleClearAllFilters} 
            className="text-[10px] text-red-500 font-bold hover:underline"
          >
            Clear Active Filters
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className={`w-full lg:w-64 shrink-0 space-y-6 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="glass-card p-6 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-primary-500">
              <span className="font-bold text-sm flex items-center gap-2">
                <SlidersHorizontal size={16} /> Filters
              </span>
              <button 
                onClick={handleClearAllFilters}
                className="text-[10px] text-accent-blue font-semibold hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 text-xs rounded-lg outline-none border-none font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="">All Categories</option>
                {getCategoryOptions().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Brand Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand</label>
              <select 
                value={selectedBrand} 
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 text-xs rounded-lg outline-none border-none font-medium text-slate-700 dark:text-slate-200"
              >
                <option value="">All Brands</option>
                {getBrandOptions().map(brnd => (
                  <option key={brnd} value={brnd}>{brnd}</option>
                ))}
              </select>
            </div>

            {/* Price inputs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Range (INR)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-primary-600 text-xs rounded-lg border-none focus:ring-1 focus:ring-accent-blue"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-primary-600 text-xs rounded-lg border-none focus:ring-1 focus:ring-accent-blue"
                />
              </div>
            </div>

            {/* Technical Specification Filters */}
            <div className="pt-4 border-t border-slate-100 dark:border-primary-500 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tech Specs</span>
              
              {/* Processor */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Processor</span>
                <select 
                  value={specProcessor} 
                  onChange={(e) => setSpecProcessor(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-primary-600 text-[10px] rounded outline-none border-none"
                >
                  <option value="">Any Processor</option>
                  <option value="i7">Core i7</option>
                  <option value="i5">Core i5</option>
                  <option value="i3">Core i3</option>
                </select>
              </div>

              {/* Memory RAM */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Memory (RAM)</span>
                <select 
                  value={specRAM} 
                  onChange={(e) => setSpecRAM(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-primary-600 text-[10px] rounded outline-none border-none"
                >
                  <option value="">Any RAM</option>
                  <option value="16GB">16GB RAM</option>
                  <option value="8GB">8GB RAM</option>
                  <option value="32GB">32GB RAM</option>
                </select>
              </div>

              {/* SSD Storage */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Storage (SSD)</span>
                <select 
                  value={specSSD} 
                  onChange={(e) => setSpecSSD(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-primary-600 text-[10px] rounded outline-none border-none"
                >
                  <option value="">Any SSD</option>
                  <option value="1TB">1TB SSD</option>
                  <option value="512GB">512GB SSD</option>
                  <option value="256GB">256GB SSD</option>
                </select>
              </div>

              {/* Operating System */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Operating System</span>
                <select 
                  value={specOS} 
                  onChange={(e) => setSpecOS(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-primary-600 text-[10px] rounded outline-none border-none"
                >
                  <option value="">Any OS</option>
                  <option value="Windows 11">Windows 11</option>
                  <option value="Windows 10">Windows 10</option>
                </select>
              </div>

            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="glass-card h-80 relative overflow-hidden bg-white/40 dark:bg-primary-600/40 shimmer border-none" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4">
              <span className="text-slate-400 text-sm">No products found matching the criteria.</span>
              <button 
                onClick={handleClearAllFilters}
                className="btn-primary py-2 px-4 text-xs font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => {
                const prodId = prod.id || (prod as any)._id;
                const brandName = typeof prod.brand === 'object' && prod.brand ? (prod.brand as any).name : prod.brand;
                return (
                  <div 
                    key={prodId}
                    onClick={() => navigate(`/product/${prodId}`)}
                    className="glass-card overflow-hidden group hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between cursor-pointer"
                  >
                    <div className="relative h-44 bg-slate-50 dark:bg-primary-700">
                      <img 
                        src={prod.images[0]} 
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button 
                        onClick={(e) => toggleWishlist(e, prod)}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 dark:bg-primary-600/80 backdrop-blur-sm shadow-sm transition-all hover:scale-110 z-10"
                      >
                        <Heart 
                          size={13} 
                          className={isInWishlist(prodId) ? 'fill-red-500 text-red-500' : 'text-slate-400 dark:text-slate-200'} 
                        />
                      </button>
                      {prod.stock === 0 ? (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                          Out of Stock
                        </span>
                      ) : prod.stock < 5 ? (
                        <span className="absolute top-3 left-3 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                          Only {prod.stock} Left
                        </span>
                      ) : null}
                    </div>

                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">{brandName}</span>
                          <div className="flex items-center text-yellow-500 text-[10px]">
                            <Star size={10} className="fill-current mr-0.5" />
                            {prod.ratingsAverage}
                          </div>
                        </div>
                        <h3 className="font-bold text-sm leading-tight text-primary-500 dark:text-primary-50 line-clamp-1">{prod.name}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{prod.description}</p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex items-baseline gap-1.5 justify-between">
                          <div>
                            <span className="text-[9px] text-slate-400 block leading-none">Excl. GST</span>
                            <span className="font-extrabold text-sm text-primary-500 dark:text-primary-50">
                              INR {prod.basePrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">GST 18%</span>
                        </div>
                        <button
                          onClick={(e) => handleAddToCart(e, prod)}
                          disabled={prod.stock === 0}
                          className="w-full btn-secondary text-xs py-2 border border-slate-100 dark:border-primary-500 font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Plus size={14} /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalog;
