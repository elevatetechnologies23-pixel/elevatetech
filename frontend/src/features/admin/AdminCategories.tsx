import React, { useState, useEffect } from 'react';
import { Plus, Layers, Tag, FolderOpen } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../utils/ToastContext';

interface CategoryItem {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | { _id: string; name: string } | null;
}

interface BrandItem {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
}

const AdminCategories: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  
  const toast = useToast();

  // Category Form States
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catParentId, setCatParentId] = useState('');

  // Brand Form States
  const [brandName, setBrandName] = useState('');
  const [brandDesc, setBrandDesc] = useState('');
  const [brandLogo, setBrandLogo] = useState('');

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const res = await api.get('/products/categories');
      if (res.data?.data) {
        setCategories(res.data.data);
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to fetch categories');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadBrands = async () => {
    setIsLoadingBrands(true);
    try {
      const res = await api.get('/products/brands');
      if (res.data?.data) {
        setBrands(res.data.data);
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to fetch brands');
    } finally {
      setIsLoadingBrands(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadBrands();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error('Validation Error', 'Category Name is required.');
      return;
    }

    try {
      const payload = {
        name: catName.trim(),
        description: catDesc.trim(),
        parentId: catParentId || null
      };

      const res = await api.post('/products/categories', payload);
      if (res.data?.status === 'success') {
        toast.success('Category Created', `Category "${catName}" has been successfully created.`);
        setCatName('');
        setCatDesc('');
        setCatParentId('');
        loadCategories();
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to create category');
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      toast.error('Validation Error', 'Brand Name is required.');
      return;
    }

    try {
      const payload = {
        name: brandName.trim(),
        description: brandDesc.trim(),
        logoUrl: brandLogo.trim() || undefined
      };

      const res = await api.post('/products/brands', payload);
      if (res.data?.status === 'success') {
        toast.success('Brand Created', `Brand "${brandName}" has been successfully created.`);
        setBrandName('');
        setBrandDesc('');
        setBrandLogo('');
        loadBrands();
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to create brand');
    }
  };

  // Helper to resolve parent category name
  const getParentName = (parentId: string | { _id: string; name: string } | null | undefined) => {
    if (!parentId) return 'None (Root)';
    if (typeof parentId === 'object') return parentId.name;
    const parent = categories.find(c => (c._id || c.id) === parentId);
    return parent ? parent.name : 'None (Root)';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-primary-500 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold">Categories & Brands Management</h2>
          <p className="text-xs text-slate-400 mt-1">Organize category trees, tag brands, and configure filter specifications.</p>
        </div>
        
        {/* Modern Tabs Toggle */}
        <div className="flex bg-slate-100 dark:bg-primary-800 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-primary-600 text-accent-blue shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === 'brands'
                ? 'bg-white dark:bg-primary-600 text-accent-blue shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Tag size={14} />
            Brands
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs">
        {activeTab === 'categories' ? (
          <>
            {/* Create Category Form */}
            <div className="glass-card p-6 h-fit space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-primary-500">
                <Plus size={16} className="text-accent-blue" /> Add New Category
              </h3>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-1">
                  <span>Category Name</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Memory Modules"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="input-field py-2"
                  />
                </div>
                
                <div className="space-y-1">
                  <span>Parent Category (Optional)</span>
                  <select
                    value={catParentId}
                    onChange={(e) => setCatParentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs text-slate-700 dark:text-slate-200"
                  >
                    <option value="">None (Root Category)</option>
                    {categories
                      .filter(c => c._id || c.id)
                      .map((cat) => (
                        <option key={cat._id || cat.id} value={cat._id || cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span>Description</span>
                  <textarea
                    placeholder="Marketing category details..."
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="input-field py-2 resize-none"
                    rows={3}
                  />
                </div>
                
                <button type="submit" className="w-full btn-primary py-2.5 rounded-xl font-bold">
                  Create Category
                </button>
              </form>
            </div>

            {/* Categories list table */}
            <div className="lg:col-span-2 glass-card overflow-hidden">
              {isLoadingCategories ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                  <FolderOpen size={32} />
                  <span>No categories found in the database.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-primary-500 bg-slate-50 dark:bg-primary-700/50">
                        <th className="px-6 py-4 font-bold text-slate-400">Category Name</th>
                        <th className="px-6 py-4 font-bold text-slate-400">Slug Reference</th>
                        <th className="px-6 py-4 font-bold text-slate-400">Parent Category</th>
                        <th className="px-6 py-4 font-bold text-slate-400">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat) => (
                        <tr key={cat._id || cat.id || cat.slug} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                          <td className="px-6 py-4 font-bold">{cat.name}</td>
                          <td className="px-6 py-4 font-mono text-accent-blue">{cat.slug}</td>
                          <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-300">
                            {getParentName(cat.parentId)}
                          </td>
                          <td className="px-6 py-4 text-slate-400">{cat.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Create Brand Form */}
            <div className="glass-card p-6 h-fit space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-primary-500">
                <Plus size={16} className="text-accent-blue" /> Add New Brand
              </h3>

              <form onSubmit={handleAddBrand} className="space-y-4">
                <div className="space-y-1">
                  <span>Brand Name</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span>Logo Image URL (Optional)</span>
                  <input
                    type="text"
                    placeholder="e.g. https://domain.com/logo.png"
                    value={brandLogo}
                    onChange={(e) => setBrandLogo(e.target.value)}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span>Description</span>
                  <textarea
                    placeholder="Brand details or vendor info..."
                    value={brandDesc}
                    onChange={(e) => setBrandDesc(e.target.value)}
                    className="input-field py-2 resize-none"
                    rows={3}
                  />
                </div>

                <button type="submit" className="w-full btn-primary py-2.5 rounded-xl font-bold">
                  Create Brand
                </button>
              </form>
            </div>

            {/* Brands list table */}
            <div className="lg:col-span-2 glass-card overflow-hidden">
              {isLoadingBrands ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : brands.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                  <FolderOpen size={32} />
                  <span>No brands found in the database.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-primary-500 bg-slate-50 dark:bg-primary-700/50">
                        <th className="px-6 py-4 font-bold text-slate-400">Logo</th>
                        <th className="px-6 py-4 font-bold text-slate-400">Brand Name</th>
                        <th className="px-6 py-4 font-bold text-slate-400">Slug Reference</th>
                        <th className="px-6 py-4 font-bold text-slate-400">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brands.map((brand) => (
                        <tr key={brand._id || brand.id || brand.slug} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                          <td className="px-6 py-4">
                            {brand.logoUrl ? (
                              <img
                                src={brand.logoUrl}
                                alt={`${brand.name} logo`}
                                className="w-8 h-8 object-contain rounded-lg border border-slate-100 dark:border-primary-500"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-primary-600 font-bold text-slate-400 uppercase text-[10px]">
                                {brand.name.substring(0, 2)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold">{brand.name}</td>
                          <td className="px-6 py-4 font-mono text-accent-blue">{brand.slug}</td>
                          <td className="px-6 py-4 text-slate-400">{brand.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
