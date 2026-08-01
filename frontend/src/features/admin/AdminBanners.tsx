import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, Plus, Edit3, Trash2, Image, Search, X, AlertTriangle, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useToast } from '../../utils/ToastContext';

interface BannerItem {
  _id?: string;
  id?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  ctaText?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
}

const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  // Create Banner Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('/catalog');
  const [ctaText, setCtaText] = useState('Explore Catalog');
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Edit Banner Modal State
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editCtaText, setEditCtaText] = useState('');
  const [editOrder, setEditOrder] = useState(1);
  const [editIsActive, setEditIsActive] = useState(true);

  // Delete Banner Modal State
  const [deletingBanner, setDeletingBanner] = useState<BannerItem | null>(null);

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/banners/admin-list');
      if (res.data?.data) {
        setBanners(res.data.data);
      }
    } catch {
      console.warn('API error fetching admin banners');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      toast.error('Validation Error', 'Title and Image URL are required.');
      return;
    }

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl.trim() || '/catalog',
      ctaText: ctaText.trim() || 'Explore Now',
      order: Number(order) || 1,
      isActive
    };

    try {
      const res = await api.post('/banners', payload);
      if (res.data?.status === 'success') {
        toast.success('Banner Created', `Hero slide "${title}" added.`);
        setIsCreateModalOpen(false);
        resetCreateForm();
        loadBanners();
      }
    } catch {
      const newB: BannerItem = {
        _id: 'b-' + Date.now(),
        ...payload
      };
      setBanners([...banners, newB]);
      toast.success('Banner Created', `Hero slide "${title}" created locally.`);
      setIsCreateModalOpen(false);
      resetCreateForm();
    }
  };

  const resetCreateForm = () => {
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setLinkUrl('/catalog');
    setCtaText('Explore Catalog');
    setOrder(banners.length + 1);
    setIsActive(true);
  };

  const handleStartEdit = (b: BannerItem) => {
    setEditingBanner(b);
    setEditTitle(b.title);
    setEditSubtitle(b.subtitle || '');
    setEditImageUrl(b.imageUrl);
    setEditLinkUrl(b.linkUrl || '/catalog');
    setEditCtaText(b.ctaText || 'Explore Now');
    setEditOrder(b.order);
    setEditIsActive(b.isActive);
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    const bId = editingBanner._id || editingBanner.id;

    const payload = {
      title: editTitle.trim(),
      subtitle: editSubtitle.trim(),
      imageUrl: editImageUrl.trim(),
      linkUrl: editLinkUrl.trim(),
      ctaText: editCtaText.trim(),
      order: Number(editOrder),
      isActive: editIsActive
    };

    try {
      await api.put(`/banners/${bId}`, payload);
      toast.success('Banner Updated', `Slide details saved.`);
      setEditingBanner(null);
      loadBanners();
    } catch {
      setBanners(banners.map(b => (b._id === bId || b.id === bId) ? { ...b, ...payload } : b));
      toast.success('Banner Updated', `Updated locally.`);
      setEditingBanner(null);
    }
  };

  const handleToggleActive = async (b: BannerItem) => {
    const bId = b._id || b.id;
    const newActiveState = !b.isActive;
    try {
      await api.put(`/banners/${bId}`, { isActive: newActiveState });
      toast.success('Status Updated', `Slide set to ${newActiveState ? 'Active' : 'Inactive'}.`);
      loadBanners();
    } catch {
      setBanners(banners.map(item => (item._id === bId || item.id === bId) ? { ...item, isActive: newActiveState } : item));
      toast.success('Status Updated', `Updated locally.`);
    }
  };

  const handleDeleteBanner = async () => {
    if (!deletingBanner) return;
    const bId = deletingBanner._id || deletingBanner.id;
    try {
      await api.delete(`/banners/${bId}`);
      toast.success('Banner Deleted', `Hero slide removed.`);
      setDeletingBanner(null);
      loadBanners();
    } catch {
      setBanners(banners.filter(b => (b._id || b.id) !== bId));
      toast.success('Banner Deleted', `Removed locally.`);
      setDeletingBanner(null);
    }
  };

  const filteredBanners = banners.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.subtitle && b.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-primary-500 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold">Hero Banner Slider Management</h2>
          <p className="text-xs text-slate-400 mt-1">Add, edit titles, imagery, button text, CTA links, and auto-play display order for homepage banners.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { resetCreateForm(); setIsCreateModalOpen(true); }}
            className="btn-primary text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-accent-blue/20"
          >
            <Plus size={14} /> Add New Hero Slide
          </button>
          <button 
            onClick={loadBanners} 
            className="btn-secondary text-xs font-semibold py-2 px-3.5 rounded-xl border flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh List
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md text-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by banner title or text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none border border-transparent focus:border-accent-blue"
        />
      </div>

      {/* Banners List Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
          <Image size={32} />
          <span>No banner slides found in database.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((b) => (
            <div 
              key={b._id || b.id || b.title}
              className={`glass-card overflow-hidden flex flex-col justify-between border transition-all ${
                b.isActive 
                  ? 'border-slate-100 dark:border-primary-500/30' 
                  : 'border-slate-200 dark:border-primary-600 opacity-60 bg-slate-50/50 dark:bg-primary-800/40'
              }`}
            >
              {/* Image Preview Container */}
              <div className="relative h-44 bg-slate-900 overflow-hidden group">
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="bg-slate-900/80 backdrop-blur-md text-accent-blue font-bold px-2.5 py-1 rounded-lg text-[10px] border border-white/10">
                      Order: #{b.order}
                    </span>
                    <button
                      onClick={() => handleToggleActive(b)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 backdrop-blur-md ${
                        b.isActive ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {b.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                      {b.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-white font-extrabold text-sm line-clamp-1">{b.title}</h3>
                    {b.subtitle && <p className="text-slate-300 text-xs line-clamp-1 mt-0.5">{b.subtitle}</p>}
                  </div>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="font-semibold">Button Text:</span>
                    <span className="font-bold text-accent-blue">{b.ctaText || 'Explore Now'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="font-semibold">Target Link:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1 truncate max-w-[180px]">
                      <ExternalLink size={10} /> {b.linkUrl}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-primary-500/20">
                  <button
                    onClick={() => handleStartEdit(b)}
                    className="flex-1 btn-secondary py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                  >
                    <Edit3 size={13} /> Edit Slide
                  </button>
                  <button
                    onClick={() => setDeletingBanner(b)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE BANNER MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus size={16} className="text-accent-blue" /> Create Hero Slide Banner
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-4">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Banner Heading Title *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen IT Infrastructure Solutions"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Subtitle Description</span>
                <input
                  type="text"
                  placeholder="e.g. Premium Enterprise Computers & Networking"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Background Image URL *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">CTA Button Text</span>
                  <input
                    type="text"
                    placeholder="e.g. Explore Catalog"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Target Route Link</span>
                  <input
                    type="text"
                    placeholder="e.g. /catalog"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="input-field py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Display Sequence Order</span>
                  <input
                    type="number"
                    min={1}
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Visibility Status</span>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Hidden (Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Create Banner Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT BANNER MODAL --- */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 size={16} className="text-accent-blue" /> Edit Hero Slide Banner
              </h3>
              <button onClick={() => setEditingBanner(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateBanner} className="space-y-4">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Banner Heading Title</span>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Subtitle Description</span>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Background Image URL</span>
                <input
                  type="text"
                  required
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">CTA Button Text</span>
                  <input
                    type="text"
                    value={editCtaText}
                    onChange={(e) => setEditCtaText(e.target.value)}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Target Route Link</span>
                  <input
                    type="text"
                    value={editLinkUrl}
                    onChange={(e) => setEditLinkUrl(e.target.value)}
                    className="input-field py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Display Sequence Order</span>
                  <input
                    type="number"
                    min={1}
                    value={editOrder}
                    onChange={(e) => setEditOrder(Number(e.target.value))}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Visibility Status</span>
                  <select
                    value={editIsActive ? 'true' : 'false'}
                    onChange={(e) => setEditIsActive(e.target.value === 'true')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                  >
                    <option value="true">Active (Visible)</option>
                    <option value="false">Hidden (Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingBanner(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
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

      {/* --- DELETE BANNER MODAL --- */}
      {deletingBanner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Delete Banner Slide?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete slide <span className="font-bold text-slate-700 dark:text-slate-200">"{deletingBanner.title}"</span>?
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setDeletingBanner(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDeleteBanner} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Delete Slide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
