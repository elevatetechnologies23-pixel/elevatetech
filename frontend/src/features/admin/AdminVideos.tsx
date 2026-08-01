import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  RefreshCw, 
  Plus, 
  Edit3, 
  Trash2, 
  Video, 
  Search, 
  X, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Play, 
  Star 
} from 'lucide-react';
import { useToast } from '../../utils/ToastContext';

interface VideoItem {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category: string;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  createdAt?: string;
}

const CATEGORIES_LIST = [
  'Product Demo',
  'Installation Guide',
  'POS Billing Tutorial',
  'CCTV Security Overview',
  'Enterprise Hardware Unboxing',
  'Corporate Overview'
];

const AdminVideos: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  // Create Video Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('Product Demo');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(1);

  // Edit Video Modal State
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editCategory, setEditCategory] = useState('Product Demo');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editOrder, setEditOrder] = useState(1);

  // Delete Video Modal State
  const [deletingVideo, setDeletingVideo] = useState<VideoItem | null>(null);

  // Active Video Lightbox Player State
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/videos/admin-list');
      if (res.data?.data) {
        setVideos(res.data.data);
      }
    } catch {
      console.warn('API error fetching admin videos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      toast.error('Validation Error', 'Title and Video URL are required.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      videoUrl: videoUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      category: category || 'Product Demo',
      isFeatured,
      isActive,
      order: Number(order) || 1
    };

    try {
      const res = await api.post('/videos', payload);
      if (res.data?.status === 'success') {
        toast.success('Video Added', `Video demo "${title}" saved.`);
        setIsCreateModalOpen(false);
        resetCreateForm();
        loadVideos();
      }
    } catch {
      const newV: VideoItem = {
        _id: 'vid-' + Date.now(),
        ...payload
      };
      setVideos([...videos, newV]);
      toast.success('Video Added', `Video saved locally.`);
      setIsCreateModalOpen(false);
      resetCreateForm();
    }
  };

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setThumbnailUrl('');
    setCategory('Product Demo');
    setIsFeatured(false);
    setIsActive(true);
    setOrder(videos.length + 1);
  };

  const handleStartEdit = (v: VideoItem) => {
    setEditingVideo(v);
    setEditTitle(v.title);
    setEditDescription(v.description || '');
    setEditVideoUrl(v.videoUrl);
    setEditThumbnailUrl(v.thumbnailUrl || '');
    setEditCategory(v.category || 'Product Demo');
    setEditIsFeatured(v.isFeatured);
    setEditIsActive(v.isActive);
    setEditOrder(v.order);
  };

  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    const vId = editingVideo._id || editingVideo.id;

    const payload = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      videoUrl: editVideoUrl.trim(),
      thumbnailUrl: editThumbnailUrl.trim(),
      category: editCategory,
      isFeatured: editIsFeatured,
      isActive: editIsActive,
      order: Number(editOrder)
    };

    try {
      await api.put(`/videos/${vId}`, payload);
      toast.success('Video Updated', `Video changes saved.`);
      setEditingVideo(null);
      loadVideos();
    } catch {
      setVideos(videos.map(v => (v._id === vId || v.id === vId) ? { ...v, ...payload } : v));
      toast.success('Video Updated', `Updated locally.`);
      setEditingVideo(null);
    }
  };

  const handleToggleActive = async (v: VideoItem) => {
    const vId = v._id || v.id;
    const newActiveState = !v.isActive;
    try {
      await api.put(`/videos/${vId}`, { isActive: newActiveState });
      toast.success('Status Updated', `Video set to ${newActiveState ? 'Active' : 'Disabled'}.`);
      loadVideos();
    } catch {
      setVideos(videos.map(item => (item._id === vId || item.id === vId) ? { ...item, isActive: newActiveState } : item));
      toast.success('Status Updated', `Updated locally.`);
    }
  };

  const handleDeleteVideo = async () => {
    if (!deletingVideo) return;
    const vId = deletingVideo._id || deletingVideo.id;
    try {
      await api.delete(`/videos/${vId}`);
      toast.success('Video Deleted', `Video showcase removed.`);
      setDeletingVideo(null);
      loadVideos();
    } catch {
      setVideos(videos.filter(v => (v._id || v.id) !== vId));
      toast.success('Video Deleted', `Removed locally.`);
      setDeletingVideo(null);
    }
  };

  // Convert YouTube link to embeddable URL
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const vidId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${vidId}?autoplay=1`;
    } else if (url.includes('youtu.be/')) {
      const vidId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${vidId}?autoplay=1`;
    }
    return url;
  };

  const filteredVideos = videos.filter(v =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    v.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-primary-500 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold">Video Showcase & Demos Management</h2>
          <p className="text-xs text-slate-400 mt-1">Manage video URLs (YouTube, MP4, Vimeo), poster thumbnails, categories, and customer play controls.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { resetCreateForm(); setIsCreateModalOpen(true); }}
            className="btn-primary text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-accent-blue/20"
          >
            <Plus size={14} /> Add New Video Link
          </button>
          <button 
            onClick={loadVideos} 
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
          placeholder="Search videos by title, description or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none border border-transparent focus:border-accent-blue"
        />
      </div>

      {/* Video Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
          <Video size={32} />
          <span>No video links found in database.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((v) => (
            <div 
              key={v._id || v.id || v.title}
              className={`glass-card overflow-hidden flex flex-col justify-between border transition-all ${
                v.isActive 
                  ? 'border-slate-100 dark:border-primary-500/30' 
                  : 'border-slate-200 dark:border-primary-600 opacity-60 bg-slate-50/50 dark:bg-primary-800/40'
              }`}
            >
              {/* Poster Thumbnail & Interactive Play Overlay */}
              <div className="relative h-48 bg-slate-900 overflow-hidden group">
                <img
                  src={v.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                  alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';
                  }}
                />
                
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="bg-slate-900/80 backdrop-blur-md text-accent-blue font-bold px-2.5 py-1 rounded-lg text-[10px] border border-white/10">
                      {v.category}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {v.isFeatured && (
                        <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border border-amber-500/30">
                          <Star size={10} fill="currentColor" /> Featured
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleActive(v)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 backdrop-blur-md ${
                          v.isActive ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {v.isActive ? <Eye size={10} /> : <EyeOff size={10} />}
                        {v.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => setPlayingVideoUrl(getEmbedUrl(v.videoUrl))}
                      className="w-14 h-14 rounded-full bg-accent-blue/90 hover:bg-accent-blue text-white flex items-center justify-center shadow-xl shadow-accent-blue/40 group-hover:scale-115 transition-all duration-300 border-2 border-white/40"
                      title="Play Preview"
                    >
                      <Play size={24} className="ml-1 fill-white" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-white font-extrabold text-sm line-clamp-1">{v.title}</h3>
                  </div>
                </div>
              </div>

              {/* Details & Action Controls */}
              <div className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                {v.description && (
                  <p className="text-slate-500 dark:text-slate-300 line-clamp-2 leading-relaxed text-[11px]">
                    {v.description}
                  </p>
                )}

                <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-primary-500/20">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="font-semibold">Target URL:</span>
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-accent-blue hover:underline flex items-center gap-1 truncate max-w-[200px]"
                    >
                      <ExternalLink size={10} /> {v.videoUrl}
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-primary-500/20">
                  <button
                    onClick={() => handleStartEdit(v)}
                    className="flex-1 btn-secondary py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                  >
                    <Edit3 size={13} /> Edit Video
                  </button>
                  <button
                    onClick={() => setDeletingVideo(v)}
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

      {/* --- CREATE VIDEO MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus size={16} className="text-accent-blue" /> Add New Video Link
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateVideo} className="space-y-4">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Video Title *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. POS & Billing Software Live Demo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Video URL Link (YouTube / Vimeo / MP4) *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="input-field py-2 font-mono"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Poster Thumbnail Image URL</span>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Video Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                >
                  {CATEGORIES_LIST.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Description Summary</span>
                <textarea
                  rows={2}
                  placeholder="Short description of the video content..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field py-2 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-accent-blue"
                  />
                  <span>Feature on Homepage</span>
                </label>

                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-accent-blue"
                  />
                  <span>Active (Visible)</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Save Video Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT VIDEO MODAL --- */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 size={16} className="text-accent-blue" /> Edit Video Link Details
              </h3>
              <button onClick={() => setEditingVideo(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateVideo} className="space-y-4">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Video Title</span>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Video URL Link</span>
                <input
                  type="text"
                  required
                  value={editVideoUrl}
                  onChange={(e) => setEditVideoUrl(e.target.value)}
                  className="input-field py-2 font-mono"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Poster Thumbnail Image URL</span>
                <input
                  type="text"
                  value={editThumbnailUrl}
                  onChange={(e) => setEditThumbnailUrl(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Video Category</span>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                >
                  {CATEGORIES_LIST.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Description Summary</span>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="input-field py-2 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsFeatured}
                    onChange={(e) => setEditIsFeatured(e.target.checked)}
                    className="rounded text-accent-blue"
                  />
                  <span>Feature on Homepage</span>
                </label>

                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="rounded text-accent-blue"
                  />
                  <span>Active (Visible)</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingVideo(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
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

      {/* --- DELETE VIDEO MODAL --- */}
      {deletingVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Delete Video Showcase Link?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete video <span className="font-bold text-slate-700 dark:text-slate-200">"{deletingVideo.title}"</span>?
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setDeletingVideo(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDeleteVideo} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VIDEO PLAYER LIGHTBOX MODAL --- */}
      {playingVideoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <button
              onClick={() => setPlayingVideoUrl(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-red-500 transition-colors"
            >
              <X size={20} />
            </button>
            <iframe
              src={playingVideoUrl}
              title="Video Player"
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVideos;
