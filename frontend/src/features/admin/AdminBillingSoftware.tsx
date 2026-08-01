import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  RefreshCw, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  AlertTriangle, 
  Cpu, 
  CheckCircle,
  Sparkles,
  Layers,
  Settings
} from 'lucide-react';
import { useToast } from '../../utils/ToastContext';
import { useSettings } from '../../utils/SettingsContext';

interface SoftwareItem {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  brand?: any;
  stock?: number;
  isFeatured?: boolean;
  specifications?: { name: string; value: string }[];
  downloadUrl?: string;
  versionTag?: string;
  softwareType?: string;
}

const SOFTWARE_CATEGORIES = [
  'Retail POS',
  'Restaurant & F&B',
  'Pharma & Medical',
  'Wholesale & ERP',
  'Auto Parts Billing',
  'Garments & Apparel',
  'General Accounting'
];

const AdminBillingSoftware: React.FC = () => {
  const { settings, reloadSettings } = useSettings();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'softwares' | 'pageSettings'>('softwares');
  const [softwares, setSoftwares] = useState<SoftwareItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');

  // Page Banner settings states
  const [billingSoftwareTitle, setBillingSoftwareTitle] = useState('');
  const [billingSoftwareSubtitle, setBillingSoftwareSubtitle] = useState('');
  const [billingSoftwareVersion, setBillingSoftwareVersion] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Add/Edit Software Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SoftwareItem | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number | string>(4999);
  const [softwareType, setSoftwareType] = useState('Retail POS');
  const [versionTag, setVersionTag] = useState('v5.2.14-Windows');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuresList, setFeaturesList] = useState<string[]>(['Single counter offline billing', 'Barcode scanner support', 'Thermal invoice printing', 'GST Return exports']);
  const [newFeature, setNewFeature] = useState('');

  // Delete Modal State
  const [deletingItem, setDeletingItem] = useState<SoftwareItem | null>(null);

  useEffect(() => {
    if (settings) {
      setBillingSoftwareTitle(settings.billingSoftwareTitle || 'Enterprise POS Billing Software');
      setBillingSoftwareSubtitle(settings.billingSoftwareSubtitle || 'Offline-first desktop software for retail invoicing, stock control, and automated GST reporting.');
      setBillingSoftwareVersion(settings.billingSoftwareVersion || 'v5.2.14-Windows');
    }
  }, [settings]);

  const loadSoftwares = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/products?category=Billing+Software');
      if (res.data?.data) {
        setSoftwares(res.data.data);
      }
    } catch {
      console.warn('Failed to fetch billing softwares');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSoftwares();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setBasePrice(4999);
    setSoftwareType('Retail POS');
    setVersionTag('v5.2.14-Windows');
    setDownloadUrl('');
    setIsFeatured(false);
    setFeaturesList([
      'Single Counter billing offline',
      'Standard Thermal Receipt print',
      'Barcode scanner integrations',
      '1 Year standard updates'
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SoftwareItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setBasePrice(item.basePrice);
    setSoftwareType(item.softwareType || (item.specifications?.find(s => s.name === 'Type')?.value) || 'Retail POS');
    setVersionTag(item.versionTag || (item.specifications?.find(s => s.name === 'Version')?.value) || 'v5.2.14-Windows');
    setDownloadUrl(item.downloadUrl || '');
    setIsFeatured(item.isFeatured || false);

    const existingFeatures = item.specifications 
      ? item.specifications.filter(s => s.name !== 'Type' && s.name !== 'Version').map(s => `${s.name}: ${s.value}`)
      : ['Thermal receipt printing', 'GST Return exports'];
    setFeaturesList(existingFeatures.length > 0 ? existingFeatures : ['Standard barcode scanner support']);
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setFeaturesList([...featuresList, newFeature.trim()]);
    setNewFeature('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== idx));
  };

  const handleSaveSoftware = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Validation Error', 'Software name is required.');
      return;
    }

    const specs = [
      { name: 'Type', value: softwareType },
      { name: 'Version', value: versionTag },
      ...featuresList.map((f, i) => ({ name: `Feature ${i + 1}`, value: f }))
    ];

    const payload = {
      name: name.trim(),
      description: description.trim(),
      basePrice: Number(basePrice),
      category: 'Billing Software',
      stock: 9999,
      isFeatured,
      specifications: specs,
      downloadUrl: downloadUrl.trim(),
      versionTag: versionTag.trim(),
      softwareType
    };

    try {
      if (editingItem) {
        const id = editingItem._id || editingItem.id;
        await api.put(`/products/${id}`, payload);
        toast.success('Software Updated', `"${name}" software details saved.`);
      } else {
        await api.post('/products', payload);
        toast.success('Software Added', `New billing software "${name}" published.`);
      }
      setIsModalOpen(false);
      loadSoftwares();
    } catch {
      toast.error('API Error', 'Failed to save software details.');
    }
  };

  const handleDeleteSoftware = async () => {
    if (!deletingItem) return;
    const id = deletingItem._id || deletingItem.id;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Software Deleted', `Software edition removed.`);
      setDeletingItem(null);
      loadSoftwares();
    } catch {
      toast.error('API Error', 'Failed to delete software.');
    }
  };

  const handleSavePageSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    const settingsArray = [
      { key: 'billingSoftwareTitle', value: billingSoftwareTitle },
      { key: 'billingSoftwareSubtitle', value: billingSoftwareSubtitle },
      { key: 'billingSoftwareVersion', value: billingSoftwareVersion }
    ];

    try {
      await api.post('/admin/settings', { settingsArray });
      await reloadSettings();
      toast.success('Header Settings Saved', 'Billing Software header text updated globally.');
    } catch {
      toast.error('API Error', 'Could not save page banner settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredSoftwares = softwares.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'All' || 
                        item.softwareType === selectedTypeFilter || 
                        item.specifications?.some(s => s.name === 'Type' && s.value === selectedTypeFilter);
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-primary-500 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu className="text-accent-blue" size={24} /> Billing Software Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage multiple billing software editions, pricing tiers, feature specs, download links, and banner text.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-accent-blue/20"
          >
            <Plus size={14} /> Add New Software
          </button>
          <button 
            onClick={loadSoftwares} 
            className="btn-secondary text-xs font-semibold py-2 px-3.5 rounded-xl border flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-primary-500/30 text-xs font-bold">
        <button
          onClick={() => setActiveTab('softwares')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'softwares' ? 'border-accent-blue text-accent-blue' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Layers size={14} /> Software Editions ({softwares.length})
        </button>
        <button
          onClick={() => setActiveTab('pageSettings')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'pageSettings' ? 'border-accent-blue text-accent-blue' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Settings size={14} /> Page Header & Banner Settings
        </button>
      </div>

      {/* TAB 1: SOFTWARE EDITIONS */}
      {activeTab === 'softwares' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md text-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search billing software by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none border border-transparent focus:border-accent-blue"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-semibold shrink-0">Type:</span>
              <button
                onClick={() => setSelectedTypeFilter('All')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${selectedTypeFilter === 'All' ? 'bg-accent-blue text-white' : 'bg-slate-100 dark:bg-primary-800 text-slate-500'}`}
              >
                All Softwares
              </button>
              {SOFTWARE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedTypeFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${selectedTypeFilter === cat ? 'bg-accent-blue text-white' : 'bg-slate-100 dark:bg-primary-800 text-slate-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Software Grid List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredSoftwares.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
              <Cpu size={32} />
              <span>No billing software editions found matching filter criteria.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSoftwares.map((sw) => {
                const typeVal = sw.softwareType || (sw.specifications?.find(s => s.name === 'Type')?.value) || 'Retail POS';
                const versionVal = sw.versionTag || (sw.specifications?.find(s => s.name === 'Version')?.value) || 'v5.2.14-Windows';
                const features = sw.specifications 
                  ? sw.specifications.filter(s => s.name !== 'Type' && s.name !== 'Version')
                  : [];

                return (
                  <div 
                    key={sw._id || sw.id}
                    className="glass-card p-6 flex flex-col justify-between border border-slate-200/60 dark:border-primary-500/30 rounded-3xl relative space-y-4"
                  >
                    {sw.isFeatured && (
                      <span className="absolute -top-3 left-6 bg-accent-blue text-white text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles size={10} className="fill-current" /> Featured Plan
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-full">
                            {typeVal}
                          </span>
                          <h3 className="font-extrabold text-sm mt-1">{sw.name}</h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{sw.description}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-primary-800 px-2 py-1 rounded-md shrink-0 font-mono">
                          {versionVal}
                        </span>
                      </div>

                      <div className="flex items-baseline pt-2">
                        <span className="text-2xl font-black text-primary-500 dark:text-primary-50">INR {sw.basePrice.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-slate-400 ml-1">/ one-time</span>
                      </div>

                      <hr className="border-slate-100 dark:border-primary-500/20" />

                      <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-300">
                        {features.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle size={12} className="text-green-500 shrink-0" />
                            <span className="line-clamp-1">{f.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-primary-500/20 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Unlimited Licenses Available</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(sw)}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-accent-blue hover:bg-accent-blue hover:text-white transition-all"
                          title="Edit Software"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingItem(sw)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          title="Delete Software"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAGE HEADER & BANNER SETTINGS */}
      {activeTab === 'pageSettings' && (
        <div className="glass-card max-w-2xl p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl border border-slate-100 dark:border-primary-500/30">
          <h3 className="font-bold text-sm text-accent-blue border-b border-slate-100 dark:border-primary-500/30 pb-2">
            Configure Public Billing Software Page Banner
          </h3>

          <form onSubmit={handleSavePageSettings} className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-500 dark:text-slate-300">Billing Software Page Title *</span>
              <input
                type="text"
                required
                value={billingSoftwareTitle}
                onChange={(e) => setBillingSoftwareTitle(e.target.value)}
                placeholder="Enterprise POS Billing Software"
                className="input-field py-2"
              />
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-500 dark:text-slate-300">Page Subtitle / Overview *</span>
              <textarea
                rows={3}
                required
                value={billingSoftwareSubtitle}
                onChange={(e) => setBillingSoftwareSubtitle(e.target.value)}
                placeholder="Offline-first desktop software for retail invoicing, stock control, and automated GST reporting..."
                className="input-field py-2 resize-none"
              />
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-500 dark:text-slate-300">Software Release Version Tag *</span>
              <input
                type="text"
                required
                value={billingSoftwareVersion}
                onChange={(e) => setBillingSoftwareVersion(e.target.value)}
                placeholder="v5.2.14-Windows"
                className="input-field py-2"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="btn-primary py-2.5 px-6 font-bold rounded-xl flex items-center gap-2"
            >
              <RefreshCw size={14} className={isSavingSettings ? 'animate-spin' : ''} /> Save Header Settings
            </button>
          </form>
        </div>
      )}

      {/* --- ADD / EDIT SOFTWARE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-xs text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Cpu size={16} className="text-accent-blue" /> {editingItem ? 'Edit Billing Software Edition' : 'Add New Billing Software Edition'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSoftware} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Software Edition Name *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Restaurant & Bar POS Software"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Software Category / Type *</span>
                  <select
                    value={softwareType}
                    onChange={(e) => setSoftwareType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                  >
                    {SOFTWARE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">One-Time License Price (INR) *</span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="4999"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="input-field py-2 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Software Version Tag *</span>
                  <input
                    type="text"
                    required
                    placeholder="v5.2.14-Windows"
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    className="input-field py-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Description / Target Industry</span>
                <textarea
                  rows={2}
                  placeholder="Designed for multi-counter billing, thermal printing, and GST compliance..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field py-2 resize-none"
                />
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Features List</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Thermal Printer & Barcode Support"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="input-field py-1.5 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="btn-primary px-3 py-1.5 font-bold rounded-lg shrink-0"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {featuresList.map((feat, idx) => (
                    <span 
                      key={idx} 
                      className="bg-slate-100 dark:bg-primary-600 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1 font-medium"
                    >
                      <CheckCircle size={10} className="text-green-500" /> {feat}
                      <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-red-400 hover:text-red-600 ml-1">
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-accent-blue"
                />
                <span>Highlight as "Most Popular" Plan</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Save Software Edition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRM MODAL --- */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Delete Software Edition?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-200">"{deletingItem.name}"</span>?
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setDeletingItem(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDeleteSoftware} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Delete Software
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBillingSoftware;
