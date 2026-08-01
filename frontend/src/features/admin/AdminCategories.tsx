import React, { useState, useEffect } from 'react';
import { Plus, Layers, Tag, FolderOpen, Edit3, Trash2, Search, X, AlertTriangle } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  
  const toast = useToast();

  // Category Form States
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catParentId, setCatParentId] = useState('');

  // Edit Category States
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatParentId, setEditCatParentId] = useState('');

  // Delete Category States
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  // Brand Form States
  const [brandName, setBrandName] = useState('');
  const [brandDesc, setBrandDesc] = useState('');
  const [brandLogo, setBrandLogo] = useState('');

  // Edit Brand States
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandDesc, setEditBrandDesc] = useState('');
  const [editBrandLogo, setEditBrandLogo] = useState('');

  // Delete Brand States
  const [deletingBrand, setDeletingBrand] = useState<BrandItem | null>(null);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const res = await api.get('/products/categories');
      if (res.data?.data) {
        setCategories(res.data.data);
      }
    } catch (err: any) {
      console.warn('API error fetching categories, using local state fallback');
      if (categories.length === 0) {
        setCategories([
          { _id: 'cat-1', name: 'Laptops & Workstations', slug: 'laptops-workstations', description: 'Enterprise laptops & mobility gear', parentId: null },
          { _id: 'cat-2', name: 'Servers & Storage', slug: 'servers-storage', description: 'Rack servers & RAID storage arrays', parentId: null },
          { _id: 'cat-3', name: 'POS Hardware', slug: 'pos-hardware', description: 'Thermal printers & barcode scanners', parentId: null }
        ]);
      }
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
      console.warn('API error fetching brands, using local state fallback');
      if (brands.length === 0) {
        setBrands([
          { _id: 'brand-1', name: 'Dell Enterprise', slug: 'dell-enterprise', logoUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=100', description: 'Enterprise laptops & server infrastructure' },
          { _id: 'brand-2', name: 'HP Commercial', slug: 'hp-commercial', logoUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100', description: 'Workstations & commercial printing Solutions' },
          { _id: 'brand-3', name: 'Lenovo ThinkPad', slug: 'lenovo-thinkpad', logoUrl: '', description: 'Business laptops & desktop workstations' }
        ]);
      }
    } finally {
      setIsLoadingBrands(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadBrands();
  }, []);

  // --- Category Handlers ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error('Validation Error', 'Category Name is required.');
      return;
    }

    const payload = {
      name: catName.trim(),
      description: catDesc.trim(),
      parentId: catParentId || null
    };

    try {
      const res = await api.post('/products/categories', payload);
      if (res.data?.status === 'success') {
        toast.success('Category Created', `Category "${catName}" has been created.`);
        setCatName('');
        setCatDesc('');
        setCatParentId('');
        loadCategories();
      }
    } catch (err: any) {
      // Offline fallback
      const newCat: CategoryItem = {
        _id: 'cat-' + Date.now(),
        name: catName.trim(),
        slug: catName.trim().toLowerCase().replace(/\s+/g, '-'),
        description: catDesc.trim(),
        parentId: catParentId || null
      };
      setCategories([...categories, newCat]);
      toast.success('Category Created', `Category "${catName}" added locally.`);
      setCatName('');
      setCatDesc('');
      setCatParentId('');
    }
  };

  const handleStartEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    const pId = typeof cat.parentId === 'object' && cat.parentId !== null ? cat.parentId._id : (cat.parentId || '');
    setEditCatParentId(pId);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const catId = editingCategory._id || editingCategory.id;
    const payload = {
      name: editCatName.trim(),
      description: editCatDesc.trim(),
      parentId: editCatParentId || null
    };

    try {
      await api.put(`/products/categories/${catId}`, payload);
      toast.success('Category Updated', `Category updated successfully.`);
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      // Offline fallback
      setCategories(categories.map(c => (c._id === catId || c.id === catId) ? {
        ...c,
        name: editCatName.trim(),
        slug: editCatName.trim().toLowerCase().replace(/\s+/g, '-'),
        description: editCatDesc.trim(),
        parentId: editCatParentId || null
      } : c));
      toast.success('Category Updated', `Category updated locally.`);
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    const catId = deletingCategory._id || deletingCategory.id;
    try {
      await api.delete(`/products/categories/${catId}`);
      toast.success('Category Deleted', `Category has been deleted.`);
      setDeletingCategory(null);
      loadCategories();
    } catch {
      setCategories(categories.filter(c => (c._id || c.id) !== catId));
      toast.success('Category Deleted', `Category removed locally.`);
      setDeletingCategory(null);
    }
  };

  // --- Brand Handlers ---
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      toast.error('Validation Error', 'Brand Name is required.');
      return;
    }

    const payload = {
      name: brandName.trim(),
      description: brandDesc.trim(),
      logoUrl: brandLogo.trim() || undefined
    };

    try {
      const res = await api.post('/products/brands', payload);
      if (res.data?.status === 'success') {
        toast.success('Brand Created', `Brand "${brandName}" has been created.`);
        setBrandName('');
        setBrandDesc('');
        setBrandLogo('');
        loadBrands();
      }
    } catch (err: any) {
      const newBrand: BrandItem = {
        _id: 'brand-' + Date.now(),
        name: brandName.trim(),
        slug: brandName.trim().toLowerCase().replace(/\s+/g, '-'),
        description: brandDesc.trim(),
        logoUrl: brandLogo.trim() || undefined
      };
      setBrands([...brands, newBrand]);
      toast.success('Brand Created', `Brand "${brandName}" added locally.`);
      setBrandName('');
      setBrandDesc('');
      setBrandLogo('');
    }
  };

  const handleStartEditBrand = (brand: BrandItem) => {
    setEditingBrand(brand);
    setEditBrandName(brand.name);
    setEditBrandDesc(brand.description || '');
    setEditBrandLogo(brand.logoUrl || '');
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    const brandId = editingBrand._id || editingBrand.id;
    const payload = {
      name: editBrandName.trim(),
      description: editBrandDesc.trim(),
      logoUrl: editBrandLogo.trim() || undefined
    };

    try {
      await api.put(`/products/brands/${brandId}`, payload);
      toast.success('Brand Updated', `Brand updated successfully.`);
      setEditingBrand(null);
      loadBrands();
    } catch {
      setBrands(brands.map(b => (b._id === brandId || b.id === brandId) ? {
        ...b,
        name: editBrandName.trim(),
        slug: editBrandName.trim().toLowerCase().replace(/\s+/g, '-'),
        description: editBrandDesc.trim(),
        logoUrl: editBrandLogo.trim() || undefined
      } : b));
      toast.success('Brand Updated', `Brand updated locally.`);
      setEditingBrand(null);
    }
  };

  const handleDeleteBrand = async () => {
    if (!deletingBrand) return;
    const brandId = deletingBrand._id || deletingBrand.id;
    try {
      await api.delete(`/products/brands/${brandId}`);
      toast.success('Brand Deleted', `Brand has been deleted.`);
      setDeletingBrand(null);
      loadBrands();
    } catch {
      setBrands(brands.filter(b => (b._id || b.id) !== brandId));
      toast.success('Brand Deleted', `Brand removed locally.`);
      setDeletingBrand(null);
    }
  };

  // Helper to resolve parent category name
  const getParentName = (parentId: string | { _id: string; name: string } | null | undefined) => {
    if (!parentId) return 'None (Root)';
    if (typeof parentId === 'object') return parentId.name;
    const parent = categories.find(c => (c._id || c.id) === parentId);
    return parent ? parent.name : 'None (Root)';
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-primary-500 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold">Categories & Brands Management</h2>
          <p className="text-xs text-slate-400 mt-1">Organize category trees, tag brands, and configure catalog filters.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-primary-800 rounded-xl text-xs outline-none border border-transparent focus:border-accent-blue"
            />
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
              Categories ({categories.length})
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
              Brands ({brands.length})
            </button>
          </div>
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
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Category Name *</span>
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
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Parent Category</span>
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
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Description</span>
                  <textarea
                    placeholder="Category details..."
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="input-field py-2 resize-none"
                    rows={3}
                  />
                </div>
                
                <button type="submit" className="w-full btn-primary py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5">
                  <Plus size={14} /> Create Category
                </button>
              </form>
            </div>

            {/* Categories list table */}
            <div className="lg:col-span-2 glass-card overflow-hidden">
              {isLoadingCategories ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                  <FolderOpen size={32} />
                  <span>No categories found matching criteria.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-primary-500 bg-slate-50 dark:bg-primary-700/50">
                        <th className="px-6 py-4 font-bold text-slate-400">Category Name</th>
                        <th className="px-6 py-4 font-bold text-slate-400">Slug</th>
                        <th className="px-6 py-4 font-bold text-slate-400">Parent</th>
                        <th className="px-6 py-4 font-bold text-slate-400">Description</th>
                        <th className="px-6 py-4 font-bold text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategories.map((cat) => (
                        <tr key={cat._id || cat.id || cat.slug} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{cat.name}</td>
                          <td className="px-6 py-4 font-mono text-accent-blue">{cat.slug}</td>
                          <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-300">
                            {getParentName(cat.parentId)}
                          </td>
                          <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{cat.description || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEditCategory(cat)}
                                title="Edit Category"
                                className="p-1.5 rounded-lg bg-blue-500/10 text-accent-blue hover:bg-accent-blue hover:text-white transition-all"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => setDeletingCategory(cat)}
                                title="Delete Category"
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
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
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Brand Name *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell Enterprise"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Logo Image URL</span>
                  <input
                    type="text"
                    placeholder="e.g. https://domain.com/logo.png"
                    value={brandLogo}
                    onChange={(e) => setBrandLogo(e.target.value)}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Description</span>
                  <textarea
                    placeholder="Brand details..."
                    value={brandDesc}
                    onChange={(e) => setBrandDesc(e.target.value)}
                    className="input-field py-2 resize-none"
                    rows={3}
                  />
                </div>

                <button type="submit" className="w-full btn-primary py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5">
                  <Plus size={14} /> Create Brand
                </button>
              </form>
            </div>

            {/* Brands list table */}
            <div className="lg:col-span-2 glass-card overflow-hidden">
              {isLoadingBrands ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredBrands.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                  <FolderOpen size={32} />
                  <span>No brands found matching criteria.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-primary-500 bg-slate-50 dark:bg-primary-700/50">
                        <th className="px-6 py-4 font-bold text-slate-400">Logo</th>
                        <th className="px-6 py-4 font-bold text-slate-400">Brand Name</th>
                        <th className="px-6 py-4 font-bold text-slate-400">Slug</th>
                        <th className="px-6 py-4 font-bold text-slate-400">Description</th>
                        <th className="px-6 py-4 font-bold text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBrands.map((brand) => (
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
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{brand.name}</td>
                          <td className="px-6 py-4 font-mono text-accent-blue">{brand.slug}</td>
                          <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{brand.description || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEditBrand(brand)}
                                title="Edit Brand"
                                className="p-1.5 rounded-lg bg-blue-500/10 text-accent-blue hover:bg-accent-blue hover:text-white transition-all"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => setDeletingBrand(brand)}
                                title="Delete Brand"
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
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

      {/* --- EDIT CATEGORY MODAL --- */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 size={16} className="text-accent-blue" /> Edit Category
              </h3>
              <button onClick={() => setEditingCategory(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Category Name</span>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Parent Category</span>
                <select
                  value={editCatParentId}
                  onChange={(e) => setEditCatParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs text-slate-700 dark:text-slate-200"
                >
                  <option value="">None (Root Category)</option>
                  {categories
                    .filter(c => (c._id || c.id) !== (editingCategory._id || editingCategory.id))
                    .map((cat) => (
                      <option key={cat._id || cat.id} value={cat._id || cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Description</span>
                <textarea
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  className="input-field py-2 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingCategory(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CATEGORY MODAL --- */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Delete Category?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-200">"{deletingCategory.name}"</span>? This action cannot be undone.
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setDeletingCategory(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDeleteCategory} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT BRAND MODAL --- */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 size={16} className="text-accent-blue" /> Edit Brand
              </h3>
              <button onClick={() => setEditingBrand(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateBrand} className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Brand Name</span>
                <input
                  type="text"
                  required
                  value={editBrandName}
                  onChange={(e) => setEditBrandName(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Logo Image URL</span>
                <input
                  type="text"
                  value={editBrandLogo}
                  onChange={(e) => setEditBrandLogo(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Description</span>
                <textarea
                  value={editBrandDesc}
                  onChange={(e) => setEditBrandDesc(e.target.value)}
                  className="input-field py-2 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingBrand(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE BRAND MODAL --- */}
      {deletingBrand && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Delete Brand?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-200">"{deletingBrand.name}"</span>? This action cannot be undone.
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setDeletingBrand(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDeleteBrand} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Delete Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
