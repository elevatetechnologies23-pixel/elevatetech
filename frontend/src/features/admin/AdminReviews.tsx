import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  RefreshCw, 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  Search, 
  X, 
  AlertTriangle, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useToast } from '../../utils/ToastContext';

interface TestimonialItem {
  _id?: string;
  id?: string;
  name?: string;
  designation?: string;
  rating: number;
  comment: string;
  isFeatured?: boolean;
  user?: any;
  product?: any;
  createdAt?: string;
}

const AdminReviews: React.FC = () => {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(true);

  // Delete Modal State
  const [deletingItem, setDeletingItem] = useState<TestimonialItem | null>(null);

  const loadTestimonials = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/products/testimonials/admin-list');
      if (res.data?.data) {
        setTestimonials(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load testimonials via API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Validation Error', 'Review comment text is required.');
      return;
    }

    const payload = {
      name: name.trim() || 'Valued Partner',
      designation: designation.trim() || 'Corporate Client',
      rating: Number(rating),
      comment: comment.trim(),
      isFeatured
    };

    try {
      const res = await api.post('/products/testimonials', payload);
      if (res.data?.status === 'success') {
        toast.success('Testimonial Added', `Review by "${payload.name}" published.`);
        setIsCreateModalOpen(false);
        resetCreateForm();
        loadTestimonials();
      }
    } catch {
      toast.error('API Error', 'Failed to save testimonial.');
    }
  };

  const resetCreateForm = () => {
    setName('');
    setDesignation('');
    setRating(5);
    setComment('');
    setIsFeatured(true);
  };

  const handleStartEdit = (t: TestimonialItem) => {
    setEditingItem(t);
    setEditName(t.name || t.user?.name || 'Valued Partner');
    setEditDesignation(t.designation || 'Client');
    setEditRating(t.rating);
    setEditComment(t.comment);
    setEditIsFeatured(t.isFeatured ?? true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const tId = editingItem._id || editingItem.id;

    const payload = {
      name: editName.trim(),
      designation: editDesignation.trim(),
      rating: Number(editRating),
      comment: editComment.trim(),
      isFeatured: editIsFeatured
    };

    try {
      await api.put(`/products/testimonials/${tId}`, payload);
      toast.success('Testimonial Updated', `Changes saved.`);
      setEditingItem(null);
      loadTestimonials();
    } catch {
      toast.error('API Error', 'Failed to update testimonial.');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    const tId = deletingItem._id || deletingItem.id;
    try {
      await api.delete(`/products/testimonials/${tId}`);
      toast.success('Testimonial Deleted', `Review entry removed.`);
      setDeletingItem(null);
      loadTestimonials();
    } catch {
      toast.error('API Error', 'Failed to delete entry.');
    }
  };

  const filteredTestimonials = testimonials.filter(t => {
    const author = (t.name || t.user?.name || '').toLowerCase();
    const company = (t.designation || '').toLowerCase();
    const text = (t.comment || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return author.includes(query) || company.includes(query) || text.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-primary-500 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold">Partner Testimonials & Customer Reviews</h2>
          <p className="text-xs text-slate-400 mt-1">Manage real customer ratings, partner reviews, and homepage testimonials showcase.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { resetCreateForm(); setIsCreateModalOpen(true); }}
            className="btn-primary text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-accent-blue/20"
          >
            <Plus size={14} /> Add Partner Review
          </button>
          <button 
            onClick={loadTestimonials} 
            className="btn-secondary text-xs font-semibold py-2 px-3.5 rounded-xl border flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh List
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md text-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by partner name, company or review content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none border border-transparent focus:border-accent-blue"
        />
      </div>

      {/* Testimonials List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
          <MessageSquare size={32} />
          <span>No testimonials or customer reviews found.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((t) => (
            <div 
              key={t._id || t.id}
              className="glass-card p-6 flex flex-col justify-between border border-slate-200/60 dark:border-primary-500/30 rounded-3xl space-y-4 text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400 gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star 
                        key={idx} 
                        size={14} 
                        className={idx < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'} 
                      />
                    ))}
                  </div>
                  {t.isFeatured && (
                    <span className="bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-amber-500/20">
                      <Sparkles size={10} fill="currentColor" /> Featured
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  "{t.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-primary-500/20 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{t.name || t.user?.name || 'Anonymous Client'}</h4>
                  <p className="text-[10px] text-slate-400">{t.designation || 'Verified Buyer'}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(t)}
                    className="p-1.5 rounded-lg bg-blue-500/10 text-accent-blue hover:bg-accent-blue hover:text-white transition-all"
                    title="Edit Review"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => setDeletingItem(t)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    title="Delete Review"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-xs text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus size={16} className="text-accent-blue" /> Add Partner Testimonial
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Partner / Author Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Designation / Company Title</span>
                <input
                  type="text"
                  placeholder="e.g. Director, K-Retail Chains"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Rating (1 to 5 Stars)</span>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                >
                  <option value={5}>5 Stars (Excellent)</option>
                  <option value={4}>4 Stars (Very Good)</option>
                  <option value={3}>3 Stars (Good)</option>
                  <option value={2}>2 Stars (Average)</option>
                  <option value={1}>1 Star (Poor)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Testimonial Review Comment *</span>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter detailed testimonial or feedback..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input-field py-2 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-accent-blue"
                />
                <span>Feature on Homepage ("What Our Partners Say")</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-xs text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 size={16} className="text-accent-blue" /> Edit Testimonial Details
              </h3>
              <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Partner / Author Name</span>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Designation / Company Title</span>
                <input
                  type="text"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Rating</span>
                <select
                  value={editRating}
                  onChange={(e) => setEditRating(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                >
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Testimonial Comment</span>
                <textarea
                  rows={3}
                  required
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="input-field py-2 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsFeatured}
                  onChange={(e) => setEditIsFeatured(e.target.checked)}
                  className="rounded text-accent-blue"
                />
                <span>Feature on Homepage</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingItem(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
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

      {/* --- DELETE MODAL --- */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Delete Testimonial Entry?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete review entry by <span className="font-bold text-slate-700 dark:text-slate-200">"{deletingItem.name || 'Author'}"</span>?
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setDeletingItem(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
