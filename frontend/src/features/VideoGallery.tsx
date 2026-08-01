import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Play, 
  Video, 
  X, 
  Sparkles, 
  Tv, 
  ExternalLink
} from 'lucide-react';

interface VideoItem {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category: string;
  isFeatured?: boolean;
  isActive?: boolean;
  order?: number;
}

const VideoGallery: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/videos');
        if (res.data?.data && res.data.data.length > 0) {
          setVideos(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load videos from API, using defaults:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideos();
  }, []);

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(videos.map(v => v.category || 'Product Demo')))];

  const filteredVideos = selectedCategory === 'All' 
    ? videos 
    : videos.filter(v => v.category === selectedCategory);

  // Convert YouTube link to embeddable player URL
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fade-in">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-accent-blue/10 text-accent-blue text-xs font-bold px-4 py-1.5 rounded-full border border-accent-blue/20">
          <Tv size={14} /> Video Demos & Tutorials Showcase
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          Explore Our Solutions <span className="text-accent-blue">In Action</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-300 leading-relaxed">
          Watch comprehensive product demonstrations, POS software tutorials, CCTV security installation guides, and B2B hardware procurement walkthroughs.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-300 shrink-0 border ${
              selectedCategory === cat
                ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-accent-blue/30 scale-105'
                : 'bg-white dark:bg-primary-700 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-primary-500/30 hover:border-accent-blue/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 space-y-3">
          <Video size={40} className="mx-auto text-slate-300" />
          <p className="text-base font-bold">No videos available in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVideos.map((vid) => (
            <div
              key={vid._id || vid.id || vid.title}
              className="glass-card overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 rounded-3xl border border-slate-200/60 dark:border-primary-500/30 flex flex-col justify-between"
            >
              {/* Poster Image with 3D Play Overlay */}
              <div 
                className="relative h-56 bg-slate-950 overflow-hidden cursor-pointer"
                onClick={() => setPlayingVideoUrl(getEmbedUrl(vid.videoUrl))}
              >
                <img
                  src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000'}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000';
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="bg-slate-900/80 backdrop-blur-md text-accent-blue font-bold px-3 py-1 rounded-full text-xs border border-white/10 shadow-md">
                      {vid.category || 'Product Demo'}
                    </span>

                    {vid.isFeatured && (
                      <span className="bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1 border border-amber-500/30 backdrop-blur-md">
                        <Sparkles size={12} fill="currentColor" /> Featured
                      </span>
                    )}
                  </div>

                  {/* 3D Play Button Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-blue to-indigo-600 text-white flex items-center justify-center shadow-[0_10px_25px_rgba(37,99,235,0.5)] group-hover:scale-115 group-hover:rotate-6 transition-all duration-300 border-2 border-white/50 backdrop-blur-md">
                      <Play size={28} className="ml-1 fill-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-extrabold text-base sm:text-lg line-clamp-1 group-hover:text-accent-blue transition-colors">
                      {vid.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Card Body Info */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between text-left">
                {vid.description && (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {vid.description}
                  </p>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-primary-500/20 flex items-center justify-between">
                  <button
                    onClick={() => setPlayingVideoUrl(getEmbedUrl(vid.videoUrl))}
                    className="btn-primary bg-accent-blue text-white text-xs sm:text-sm font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2 shadow-md shadow-accent-blue/20"
                  >
                    <Play size={14} className="fill-white" /> Watch Video
                  </button>

                  <a
                    href={vid.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-accent-blue font-semibold flex items-center gap-1"
                  >
                    Open Source <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- VIDEO PLAYER LIGHTBOX MODAL --- */}
      {playingVideoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <button
              onClick={() => setPlayingVideoUrl(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-red-500 transition-colors border border-white/20"
              aria-label="Close Video Player"
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

export default VideoGallery;
