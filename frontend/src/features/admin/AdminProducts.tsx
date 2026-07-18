import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import api from '../../services/api';
import { MOCK_PRODUCTS } from '../../utils/mockData';
import type { ProductItem } from '../../utils/mockData';
import { Plus, Trash2, Edit3, X, Save, Percent } from 'lucide-react';
import { useToast } from '../../utils/ToastContext';

// Indian GST slabs
const GST_SLABS = [0, 5, 12, 18, 28];

const AdminProducts: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [categoryName, setCategoryName] = useState('Laptop');
  const [brandName, setBrandName] = useState('Lenovo');
  const [basePrice, setBasePrice] = useState('');
  const [gstPercentage, setGstPercentage] = useState(18);
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [specifications, setSpecifications] = useState<{ name: string; value: string }[]>([]);
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

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

  const loadCategoriesAndBrands = async () => {
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
    } catch (error) {
      console.warn('Failed to load categories or brands from API, using defaults');
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/products?status=active');
      if (res.data?.data) {
        setProducts(res.data.data);
      }
    } catch {
      console.warn('API error, using offline products');
      setProducts(MOCK_PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategoriesAndBrands();
  }, []);

  const handleAddSpec = () => {
    if (!newSpecName.trim() || !newSpecValue.trim()) return;
    setSpecifications([...specifications, { name: newSpecName.trim(), value: newSpecValue.trim() }]);
    setNewSpecName('');
    setNewSpecValue('');
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setName('');
    setSku('');
    setModelNumber('');
    setCategoryName('Laptop');
    setBrandName('Lenovo');
    setBasePrice('');
    setGstPercentage(18);
    setStock('');
    setDescription('');
    setImageUrl('');
    setIsFeatured(false);
    setSpecifications([]);
    setShowModal(true);
  };

  const handleOpenEditModal = (prod: ProductItem) => {
    setEditingId((prod as any)._id || prod.id);
    setName(prod.name);
    setSku(prod.sku);
    setModelNumber(prod.modelNumber);
    setCategoryName(typeof prod.category === 'object' ? (prod.category as any).name : prod.category);
    setBrandName(typeof prod.brand === 'object' ? (prod.brand as any).name : prod.brand);
    setBasePrice(prod.basePrice.toString());
    setGstPercentage(prod.gstPercentage ?? 18);
    setStock(prod.stock.toString());
    setDescription(prod.description);
    setImageUrl(prod.images && prod.images.length > 0 ? prod.images[0] : '');
    setIsFeatured(!!prod.isFeatured);
    setSpecifications(prod.specifications || []);
    setShowModal(true);
  };

  const handleDeleteProduct = async (prod: ProductItem) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const id = (prod as any)._id || prod.id;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product Deleted', `${prod.name} has been removed.`);
      loadProducts();
    } catch {
      setProducts(products.filter(p => ((p as any)._id || p.id) !== id));
      toast.success('Product Deleted', `${prod.name} has been removed.`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      sku,
      modelNumber,
      categoryName,
      brandName,
      basePrice: Number(basePrice),
      gstPercentage: Number(gstPercentage),
      stock: Number(stock),
      description,
      isFeatured,
      images: [imageUrl || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60'],
      specifications
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success('Product Updated', `${name} has been saved successfully.`);
      } else {
        await api.post('/products', payload);
        toast.success('Product Created', `${name} has been added to the catalog.`);
      }
      setShowModal(false);
      loadProducts();
    } catch {
      // Simulate local save on API failure
      if (editingId) {
        setProducts(products.map(p => ((p as any)._id || p.id) === editingId ? {
          ...p,
          name,
          sku,
          modelNumber,
          category: categoryName as any,
          brand: brandName as any,
          basePrice: Number(basePrice),
          gstPercentage: Number(gstPercentage),
          stock: Number(stock),
          description,
          isFeatured,
          specifications
        } : p));
      } else {
        const newProduct: ProductItem = {
          id: 'prod-' + Math.floor(1000 + Math.random() * 9000).toString(),
          name,
          sku,
          modelNumber,
          category: categoryName as any,
          brand: brandName as any,
          basePrice: Number(basePrice),
          gstPercentage: Number(gstPercentage),
          stock: Number(stock),
          images: [imageUrl || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60'],
          description,
          specifications,
          isFeatured,
          ratingsAverage: 5.0
        };
        setProducts([newProduct, ...products]);
      }
      setShowModal(false);
    }
  };

  // Live price calculation for preview
  const basePriceNum = Number(basePrice) || 0;
  const gstAmount = basePriceNum * (gstPercentage / 100);
  const totalPrice = basePriceNum + gstAmount;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-primary-500 pb-4">
        <h2 className="text-xl font-bold">Product Catalog Manager</h2>
        {user?.role === 'admin' && (
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary text-xs font-semibold py-2 px-4 flex items-center gap-1"
          >
            <Plus size={14} /> Add New Product
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-primary-500 bg-slate-50 dark:bg-primary-700/50">
                <th className="px-6 py-4 font-bold text-slate-400">Product Name</th>
                <th className="px-6 py-4 font-bold text-slate-400">SKU / Model</th>
                <th className="px-6 py-4 font-bold text-slate-400">Stock</th>
                <th className="px-6 py-4 font-bold text-slate-400">Base Price</th>
                <th className="px-6 py-4 font-bold text-slate-400">GST</th>
                <th className="px-6 py-4 font-bold text-slate-400">MRP (Incl. GST)</th>
                <th className="px-6 py-4 font-bold text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => {
                const catName = typeof prod.category === 'object' && prod.category ? (prod.category as any).name : prod.category;
                const gst = prod.gstPercentage ?? 18;
                const mrp = prod.basePrice * (1 + gst / 100);
                return (
                  <tr key={(prod as any)._id || prod.id} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                    <td className="px-6 py-4 font-bold">
                      <span>{prod.name}</span>
                      <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{catName}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium">
                      <span>{prod.sku}</span>
                      <span className="text-[9px] text-slate-400 block font-sans mt-0.5">{prod.modelNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      {prod.stock === 0 ? (
                        <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded text-[10px] font-semibold">Out of Stock</span>
                      ) : prod.stock < 5 ? (
                        <span className="text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded text-[10px] font-semibold">Only {prod.stock} left</span>
                      ) : (
                        <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded text-[10px] font-semibold">{prod.stock} units</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold">INR {prod.basePrice.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className="bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 w-fit">
                        <Percent size={9} />{gst}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-accent-blue">INR {Math.round(mrp).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-right space-x-2 shrink-0">
                      {user?.role === 'admin' ? (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="text-slate-400 hover:text-accent-blue p-1.5 border border-slate-100 dark:border-primary-500 rounded-lg hover:bg-white"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="text-slate-300 hover:text-red-500 p-1.5 border border-slate-100 dark:border-primary-500 rounded-lg hover:bg-white"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Read-Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="glass-card max-w-2xl w-full p-5 sm:p-7 space-y-5 animate-fade-in relative bg-white dark:bg-primary-700 max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-100 dark:border-primary-500/20 shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-primary-500"
            >
              <X size={18} />
            </button>

            <h3 className="font-bold text-sm border-b border-slate-100 dark:border-primary-500 pb-2">
              {editingId ? 'Modify Product Specifications' : 'Add New Hardware Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="col-span-2 space-y-1">
                <span>Product Display Name</span>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="input-field py-2" placeholder="e.g. ThinkPad L14 Gen 4"
                />
              </div>
              <div className="space-y-1">
                <span>SKU Code</span>
                <input
                  type="text" required value={sku} onChange={(e) => setSku(e.target.value)}
                  className="input-field py-2 uppercase" placeholder="e.g. THINK-L14-G4"
                />
              </div>
              <div className="space-y-1">
                <span>Model Number</span>
                <input
                  type="text" required value={modelNumber} onChange={(e) => setModelNumber(e.target.value)}
                  className="input-field py-2" placeholder="e.g. 21H1003VIG"
                />
              </div>
              <div className="space-y-1">
                <span>Category Name</span>
                <select
                  value={categoryName} onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs text-slate-700 dark:text-slate-200"
                >
                  {getCategoryOptions().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <span>Brand Vendor</span>
                <select
                  value={brandName} onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs text-slate-700 dark:text-slate-200"
                >
                  {getBrandOptions().map(brnd => (
                    <option key={brnd} value={brnd}>{brnd}</option>
                  ))}
                </select>
              </div>

              {/* Base Price + GST side by side */}
              <div className="space-y-1">
                <span>Base Price (INR, Excl. GST)</span>
                <input
                  type="number" required min="0" value={basePrice} onChange={(e) => setBasePrice(e.target.value)}
                  className="input-field py-2" placeholder="e.g. 58000"
                />
              </div>
              <div className="space-y-1">
                <span className="flex items-center gap-1">
                  <Percent size={11} /> GST Rate (%)
                </span>
                <select
                  value={gstPercentage} onChange={(e) => setGstPercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                >
                  {GST_SLABS.map(slab => (
                    <option key={slab} value={slab}>{slab}% GST{slab === 18 ? ' (Standard)' : slab === 28 ? ' (Luxury)' : slab === 5 ? ' (Essential)' : slab === 0 ? ' (Exempt)' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Live Price Preview */}
              {basePriceNum > 0 && (
                <div className="col-span-2 bg-slate-50 dark:bg-primary-600/50 rounded-xl px-4 py-3 flex gap-6 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Base (Excl. GST)</span>
                    <span className="font-bold">INR {basePriceNum.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">+ GST ({gstPercentage}%)</span>
                    <span className="font-bold text-orange-500">INR {Math.round(gstAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">MRP (Incl. GST)</span>
                    <span className="font-bold text-accent-blue">INR {Math.round(totalPrice).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span>Initial Stock Level</span>
                <input
                  type="number" required min="0" value={stock} onChange={(e) => setStock(e.target.value)}
                  className="input-field py-2" placeholder="e.g. 15"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-accent-blue rounded cursor-pointer"
                />
                <label htmlFor="isFeatured" className="text-xs font-semibold cursor-pointer select-none">
                  Mark as Featured Solution (Homepage)
                </label>
              </div>

              <div className="col-span-2 space-y-2">
                <span>Product Photo</span>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1 space-y-2 w-full">
                    <input
                      type="file" accept="image/*" onChange={handleImageChange}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-primary-600 dark:file:text-slate-200 cursor-pointer"
                    />
                    <input
                      type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                      className="input-field py-2" placeholder="Or paste direct image URL here..."
                    />
                  </div>
                  {imageUrl && (
                    <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-primary-500 overflow-hidden shrink-0 self-center">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <span>Marketing Description</span>
                <textarea
                  required value={description} onChange={(e) => setDescription(e.target.value)}
                  className="input-field py-2 resize-none" rows={3} placeholder="Provide details..."
                />
              </div>

              {/* Technical Specifications Section */}
              <div className="col-span-2 border-t border-slate-100 dark:border-primary-500/20 pt-4 space-y-3 text-left">
                <span className="font-bold text-xs text-slate-400 uppercase tracking-wider block">Technical Specifications</span>
                
                {/* List of current specs */}
                {specifications.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {specifications.map((spec, index) => (
                      <div key={index} className="flex justify-between items-center bg-slate-50 dark:bg-primary-600/30 p-2 rounded-lg border border-slate-100 dark:border-primary-500/5">
                        <span className="font-bold">{spec.name}: <span className="font-medium text-slate-400">{spec.value}</span></span>
                        <button
                          type="button"
                          onClick={() => setSpecifications(specifications.filter((_, idx) => idx !== index))}
                          className="text-red-500 hover:text-red-600 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form to add a spec */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-slate-400">Spec Name (e.g. RAM, SSD, Print Speed)</span>
                    <input
                      type="text"
                      placeholder="e.g. RAM"
                      value={newSpecName}
                      onChange={(e) => setNewSpecName(e.target.value)}
                      className="input-field py-1 text-xs"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-slate-400">Spec Value (e.g. 16GB DDR5, 1TB NVMe, 35 ppm)</span>
                    <input
                      type="text"
                      placeholder="e.g. 16GB DDR5"
                      value={newSpecValue}
                      onChange={(e) => setNewSpecValue(e.target.value)}
                      className="input-field py-1 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="btn-secondary py-1.5 px-3 text-xs font-bold shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="col-span-2 flex gap-4 pt-2">
                <button type="submit" className="w-full btn-primary py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5">
                  <Save size={14} /> Save Product Specifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProducts;
