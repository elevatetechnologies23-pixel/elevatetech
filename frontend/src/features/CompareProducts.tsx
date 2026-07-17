import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { MOCK_PRODUCTS } from '../utils/mockData';
import type { ProductItem } from '../utils/mockData';
import api from '../services/api';
import { addToCart } from '../store/cartSlice';
import { useToast } from '../utils/ToastContext';
import {
  ArrowRightLeft,
  ShoppingCart,
  Percent,
  X
} from 'lucide-react';

const CompareProducts: React.FC = () => {
  const dispatch = useDispatch();
  const toast = useToast();

  const [productsList, setProductsList] = useState<ProductItem[]>(MOCK_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');


  const [prodId1, setProdId1] = useState('');
  const [prodId2, setProdId2] = useState('');
  const [prodId3, setProdId3] = useState('');

  const getCategoryName = (prod: ProductItem | null): string => {
    if (!prod) return '';
    return typeof prod.category === 'object' && prod.category
      ? (prod.category as any).name
      : prod.category;
  };

  const uniqueCategories = Array.from(new Set(
    productsList.map(p => getCategoryName(p)).filter(Boolean)
  )) as string[];

  const initializeCompare = (list: ProductItem[]) => {
    if (list.length > 0) {
      const firstProd = list[0];
      const firstId = firstProd.id || (firstProd as any)._id;
      setProdId1(firstId);

      const cat = getCategoryName(firstProd);
      setSelectedCategory(cat || 'All');

      // Find another product in the same category for Slot 2
      const secondProd = list.find(p => {
        const pId = p.id || (p as any)._id;
        const pCat = getCategoryName(p);
        return pId !== firstId && pCat === cat;
      });

      if (secondProd) {
        setProdId2(secondProd.id || (secondProd as any)._id);
      } else {
        setProdId2('');
      }
      setProdId3('');
    }
  };

  // Fetch products list from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products?status=active');
        if (res.data?.data) {
          const fetched = res.data.data;
          setProductsList(fetched);
          initializeCompare(fetched);
        }
      } catch {
        console.warn('API error, using offline products for comparison');
        setProductsList(MOCK_PRODUCTS);
        initializeCompare(MOCK_PRODUCTS);
      }
    };
    fetchProducts();
  }, []);

  const getProductObj = (id: string): ProductItem | null => {
    if (!id) return null;
    return productsList.find(p => (p.id || (p as any)._id) === id) || null;
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);

    // Find products in this category
    const filtered = productsList.filter(p => {
      const pCat = getCategoryName(p);
      return cat === 'All' || pCat === cat;
    });

    if (filtered.length > 0) {
      const firstId = filtered[0].id || (filtered[0] as any)._id;
      setProdId1(firstId);

      const secondProd = filtered.find(p => (p.id || (p as any)._id) !== firstId);
      if (secondProd) {
        setProdId2(secondProd.id || (secondProd as any)._id);
      } else {
        setProdId2('');
      }
    } else {
      setProdId1('');
      setProdId2('');
    }
    setProdId3('');
  };

  const handleSlot1Change = (id: string) => {
    setProdId1(id);
    const prod = productsList.find(p => (p.id || (p as any)._id) === id);
    if (prod) {
      const cat = getCategoryName(prod);
      setSelectedCategory(cat || 'All');

      // Check if current slot 2 is in the same category
      const p2 = getProductObj(prodId2);
      const p2Cat = getCategoryName(p2);
      if (p2Cat !== cat) {
        // Find another product in the same category for Slot 2
        const secondProd = productsList.find(p => {
          const pId = p.id || (p as any)._id;
          const pCat = getCategoryName(p);
          return pId !== id && pCat === cat;
        });
        setProdId2(secondProd ? (secondProd.id || (secondProd as any)._id) : '');
      }

      // Check if current slot 3 is in the same category
      const p3 = getProductObj(prodId3);
      const p3Cat = getCategoryName(p3);
      if (p3Cat !== cat) {
        setProdId3('');
      }
    }
  };

  const getFilteredProductsForSlot = (slotNum: number) => {
    return productsList.filter(p => {
      const cat = getCategoryName(p);

      // Filter by category
      if (selectedCategory !== 'All' && cat !== selectedCategory) {
        return false;
      }

      // Exclude product selected in other slots to avoid duplicates
      const pId = p.id || (p as any)._id;
      if (slotNum === 1) {
        return pId !== prodId2 && pId !== prodId3;
      }
      if (slotNum === 2) {
        return pId !== prodId1 && pId !== prodId3;
      }
      if (slotNum === 3) {
        return pId !== prodId1 && pId !== prodId2;
      }
      return true;
    });
  };

  const product1 = getProductObj(prodId1);
  const product2 = getProductObj(prodId2);
  const product3 = getProductObj(prodId3);

  const activeProducts = [product1, product2, product3].filter((p): p is ProductItem => p !== null);

  // Extract all unique specs keys
  const allSpecKeys = Array.from(new Set(
    activeProducts.flatMap(p => p.specifications?.map(s => s.name) || [])
  ));

  const getSpecValue = (prod: ProductItem, name: string) => {
    const spec = prod.specifications?.find(s => s.name === name);
    return spec ? spec.value : 'N/A';
  };

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
    toast.cart('Added to Cart!', `${prod.name} has been added to your cart.`);
  };

  // GST calculations
  const getGstAmount = (price: number, rate: number) => price * (rate / 100);
  const getGrandTotal = (price: number, rate: number) => price + getGstAmount(price, rate);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">

      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-[10px] uppercase font-bold text-accent-blue tracking-widest bg-accent-blue/10 px-3 py-1 rounded-full">B2B Procurement Tools</span>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2 mt-2">
          <ArrowRightLeft className="text-accent-blue" size={26} /> Compare Side-by-Side Solution
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Compare specifications, pricing structures, and Input Tax Credit (ITC) savings to find the optimal deployment path for your business.
        </p>
      </div>

      {/* Selectors & Category Control Bar */}
      <div className="glass-card p-6 bg-slate-50/50 dark:bg-primary-700/20 space-y-6">
        {/* Category Header Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-primary-500 pb-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-accent-blue tracking-widest bg-accent-blue/10 px-2.5 py-0.5 rounded-full">Comparison Category</label>
            <p className="text-[11px] text-slate-400">Filter comparison selectors to compare similar products side-by-side.</p>
          </div>
          <div className="w-full sm:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-primary-700 text-xs rounded-xl outline-none border border-slate-200 dark:border-primary-500 font-bold text-slate-700 dark:text-slate-200 transition-all focus:border-accent-blue"
            >
              <option value="All">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Selector 1 */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Slot 1</label>
            <select
              value={prodId1}
              onChange={(e) => handleSlot1Change(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-primary-700 text-xs rounded-xl outline-none border border-slate-200 dark:border-primary-500 font-semibold focus:border-accent-blue"
            >
              <option value="" disabled>Choose Product...</option>
              {getFilteredProductsForSlot(1).map(p => (
                <option key={p.id || (p as any)._id} value={p.id || (p as any)._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Selector 2 */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Slot 2</label>
            <select
              value={prodId2}
              onChange={(e) => setProdId2(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-primary-700 text-xs rounded-xl outline-none border border-slate-200 dark:border-primary-500 font-semibold focus:border-accent-blue"
            >
              <option value="">-- No Product Selected --</option>
              {getFilteredProductsForSlot(2).map(p => (
                <option key={p.id || (p as any)._id} value={p.id || (p as any)._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Selector 3 (Optional) */}
          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Slot 3 (Optional)</label>
              {prodId3 && (
                <button
                  onClick={() => setProdId3('')}
                  className="text-[9px] text-red-500 hover:underline flex items-center gap-0.5"
                >
                  <X size={8} /> Clear
                </button>
              )}
            </div>
            <select
              value={prodId3}
              onChange={(e) => setProdId3(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-primary-700 text-xs rounded-xl outline-none border border-slate-200 dark:border-primary-500 font-semibold focus:border-accent-blue"
            >
              <option value="">-- No Product Selected --</option>
              {getFilteredProductsForSlot(3).map(p => (
                <option key={p.id || (p as any)._id} value={p.id || (p as any)._id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeProducts.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <ArrowRightLeft className="text-slate-300 mx-auto" size={40} />
          <p className="text-sm font-bold text-slate-400">Select products above to compare them side-by-side</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Main Specs Grid Table */}
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-primary-500 bg-slate-50/50 dark:bg-primary-700/50">
                  <th className="px-6 py-5 font-bold text-slate-400 w-1/4">Key Parameters</th>
                  {activeProducts.map((prod) => (
                    <th key={prod.id || (prod as any)._id} className="px-6 py-5 font-extrabold text-sm text-primary-500 dark:text-primary-50">
                      <div className="space-y-3">
                        <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-primary-600 overflow-hidden shadow-inner flex items-center justify-center">
                          <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="line-clamp-2 max-w-[200px]">{prod.name}</div>
                        <button
                          onClick={(e) => handleAddToCart(e, prod)}
                          className="btn-primary py-1.5 px-3 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 w-fit shadow-none mt-1"
                        >
                          <ShoppingCart size={11} /> Add to Cart
                        </button>
                      </div>
                    </th>
                  ))}
                  {/* Fill empty slot spacing if only 2 selected */}
                  {activeProducts.length === 2 && <th className="w-1/4"></th>}
                </tr>
              </thead>
              <tbody>

                {/* Brand */}
                <tr className="border-b border-slate-100 dark:border-primary-500 hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                  <td className="px-6 py-4 bg-slate-50/30 dark:bg-primary-700/10 font-bold text-slate-400">Brand Vendor</td>
                  {activeProducts.map(prod => (
                    <td key={prod.id || (prod as any)._id} className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-200">
                      {typeof prod.brand === 'object' && prod.brand ? (prod.brand as any).name : prod.brand}
                    </td>
                  ))}
                  {activeProducts.length === 2 && <td className="px-6 py-4"></td>}
                </tr>

                {/* Pricing Breakdown */}
                <tr className="border-b border-slate-100 dark:border-primary-500 hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                  <td className="px-6 py-4 bg-slate-50/30 dark:bg-primary-700/10 font-bold text-slate-400">Base Price (Excl. GST)</td>
                  {activeProducts.map(prod => (
                    <td key={prod.id || (prod as any)._id} className="px-6 py-4 font-extrabold text-sm text-primary-500 dark:text-primary-50">
                      INR {prod.basePrice.toLocaleString('en-IN')}
                    </td>
                  ))}
                  {activeProducts.length === 2 && <td className="px-6 py-4"></td>}
                </tr>

                {/* GST Rate */}
                <tr className="border-b border-slate-100 dark:border-primary-500 hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                  <td className="px-6 py-4 bg-slate-50/30 dark:bg-primary-700/10 font-bold text-slate-400">GST Slab Rate</td>
                  {activeProducts.map(prod => (
                    <td key={prod.id || (prod as any)._id} className="px-6 py-4 font-semibold text-orange-500">
                      {prod.gstPercentage}% GST
                    </td>
                  ))}
                  {activeProducts.length === 2 && <td className="px-6 py-4"></td>}
                </tr>

                {/* Tax Amount */}
                <tr className="border-b border-slate-100 dark:border-primary-500 hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                  <td className="px-6 py-4 bg-slate-50/30 dark:bg-primary-700/10 font-bold text-slate-400">GST Tax Amount</td>
                  {activeProducts.map(prod => (
                    <td key={prod.id || (prod as any)._id} className="px-6 py-4 font-semibold text-slate-500">
                      INR {Math.round(getGstAmount(prod.basePrice, prod.gstPercentage)).toLocaleString('en-IN')}
                    </td>
                  ))}
                  {activeProducts.length === 2 && <td className="px-6 py-4"></td>}
                </tr>

                {/* Grand Total */}
                <tr className="border-b border-slate-100 dark:border-primary-500 hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                  <td className="px-6 py-4 bg-slate-50/30 dark:bg-primary-700/10 font-bold text-slate-400">Total Price (Incl. GST)</td>
                  {activeProducts.map(prod => (
                    <td key={prod.id || (prod as any)._id} className="px-6 py-4 font-extrabold text-accent-blue">
                      INR {Math.round(getGrandTotal(prod.basePrice, prod.gstPercentage)).toLocaleString('en-IN')}
                    </td>
                  ))}
                  {activeProducts.length === 2 && <td className="px-6 py-4"></td>}
                </tr>

                {/* GST Input Tax Credit */}
                <tr className="border-b border-slate-100 dark:border-primary-500 bg-green-500/5 hover:bg-green-500/10 transition-colors">
                  <td className="px-6 py-4 bg-green-500/10 font-bold text-green-700 dark:text-green-400">B2B Reclaimable ITC Savings</td>
                  {activeProducts.map(prod => {
                    const gstAmount = getGstAmount(prod.basePrice, prod.gstPercentage);
                    return (
                      <td key={prod.id || (prod as any)._id} className="px-6 py-4 font-extrabold text-green-600 dark:text-green-400">
                        INR {Math.round(gstAmount).toLocaleString('en-IN')}
                        <span className="block text-[9px] text-slate-400 font-normal mt-0.5">Reclaimed via GSTR-2B filing</span>
                      </td>
                    );
                  })}
                  {activeProducts.length === 2 && <td className="px-6 py-4"></td>}
                </tr>

                {/* Net Effective Cost */}
                <tr className="border-b border-slate-100 dark:border-primary-500 hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                  <td className="px-6 py-4 bg-slate-50/30 dark:bg-primary-700/10 font-bold text-slate-400">Net Effective Cost (Excl. Tax)</td>
                  {activeProducts.map(prod => (
                    <td key={prod.id || (prod as any)._id} className="px-6 py-4 font-bold text-slate-700 dark:text-slate-100">
                      INR {prod.basePrice.toLocaleString('en-IN')}
                    </td>
                  ))}
                  {activeProducts.length === 2 && <td className="px-6 py-4"></td>}
                </tr>

                {/* Availability */}
                <tr className="border-b border-slate-100 dark:border-primary-500 hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                  <td className="px-6 py-4 bg-slate-50/30 dark:bg-primary-700/10 font-bold text-slate-400">Availability</td>
                  {activeProducts.map(prod => (
                    <td key={prod.id || (prod as any)._id} className="px-6 py-4 font-semibold">
                      {prod.stock > 0 ? (
                        <span className="text-green-500">{prod.stock} units in stock</span>
                      ) : (
                        <span className="text-red-500">Out of Stock</span>
                      )}
                    </td>
                  ))}
                  {activeProducts.length === 2 && <td className="px-6 py-4"></td>}
                </tr>

                {/* Ratings */}
                <tr className="border-b border-slate-100 dark:border-primary-500 hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                  <td className="px-6 py-4 bg-slate-50/30 dark:bg-primary-700/10 font-bold text-slate-400">Client Rating</td>
                  {activeProducts.map(prod => (
                    <td key={prod.id || (prod as any)._id} className="px-6 py-4 font-semibold text-yellow-600 dark:text-yellow-400">
                      {prod.ratingsAverage} / 5
                    </td>
                  ))}
                  {activeProducts.length === 2 && <td className="px-6 py-4"></td>}
                </tr>

                {/* Dynamic Specs Rows */}
                {allSpecKeys.map(key => (
                  <tr key={key} className="border-b border-slate-100 dark:border-primary-500 hover:bg-slate-50/50 dark:hover:bg-primary-600/30 last:border-none">
                    <td className="px-6 py-4 bg-slate-50/30 dark:bg-primary-700/10 font-bold text-slate-400">{key}</td>
                    {activeProducts.map(prod => (
                      <td key={prod.id || (prod as any)._id} className="px-6 py-4 text-slate-600 dark:text-slate-200">
                        {getSpecValue(prod, key)}
                      </td>
                    ))}
                    {activeProducts.length === 2 && <td className="px-6 py-4"></td>}
                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          {/* B2B Tax Credit Advisory Card */}
          <div className="glass-card p-6 bg-gradient-to-r from-blue-500/5 to-green-500/5 border-l-4 border-l-accent-blue flex flex-col md:flex-row gap-6 items-start md:items-center justify-between text-left">
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-primary-500 dark:text-primary-50">
                <Percent size={16} className="text-accent-blue" />
                GST Input Tax Credit (ITC) Corporate Advisor
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 max-w-3xl leading-relaxed">
                Under Section 16 of the CGST Act, your company can offset the entire GST tax amount displayed above against outgoing tax liabilities. Adding your corporate **GSTIN** and registered entity name during checkout will automatically issue a compliant tax invoice with ITC capabilities enabled.
              </p>
            </div>
            {activeProducts.length > 1 && (
              <div className="bg-white dark:bg-primary-700 border border-slate-200 dark:border-primary-500 rounded-2xl p-4 shrink-0 shadow-sm w-full md:w-auto text-xs space-y-1">
                <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Max Potential Tax Reclaim</div>
                <div className="text-xl font-extrabold text-green-600 dark:text-green-400">
                  INR {Math.max(...activeProducts.map(p => Math.round(getGstAmount(p.basePrice, p.gstPercentage)))).toLocaleString('en-IN')}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default CompareProducts;
