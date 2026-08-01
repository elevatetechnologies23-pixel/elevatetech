import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import type { ProductItem } from '../utils/mockData';
import type { RootState } from '../store';
import { addToWishlist, removeFromWishlist } from '../store/wishlistSlice';
import { useToast } from '../utils/ToastContext';
import { useSettings } from '../utils/SettingsContext';
import {
  Laptop,
  ShieldCheck,
  Settings,
  Layers,
  Star,
  TrendingUp,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Heart,
  Play,
  Tv,
  X
} from 'lucide-react';

const CATEGORIES = [
  { 
    name: 'Laptop & Workstations', 
    categoryQuery: 'Laptop',
    icon: Laptop, 
    count: '15+ Enterprise Models',
    gradient: 'from-blue-500 via-indigo-500 to-blue-700',
    shadow: 'shadow-[0_12px_30px_rgba(37,99,235,0.35)] dark:shadow-[0_14px_35px_rgba(37,99,235,0.5)]'
  },
  { 
    name: 'CCTV & Security', 
    categoryQuery: 'CCTV Camera',
    icon: ShieldCheck, 
    count: '30+ IP Camera Models',
    gradient: 'from-emerald-500 via-teal-500 to-emerald-700',
    shadow: 'shadow-[0_12px_30px_rgba(16,185,129,0.35)] dark:shadow-[0_14px_35px_rgba(16,185,129,0.5)]'
  },
  { 
    name: 'Billing & POS Software', 
    categoryQuery: 'Billing Software',
    icon: Settings, 
    count: '3 Edition Licenses',
    gradient: 'from-amber-500 via-orange-500 to-amber-700',
    shadow: 'shadow-[0_12px_30px_rgba(245,158,11,0.35)] dark:shadow-[0_14px_35px_rgba(245,158,11,0.5)]'
  },
  { 
    name: 'Networking & Servers', 
    categoryQuery: 'Networking',
    icon: Layers, 
    count: '45+ Enterprise Racks',
    gradient: 'from-purple-500 via-violet-500 to-indigo-700',
    shadow: 'shadow-[0_12px_30px_rgba(139,92,246,0.35)] dark:shadow-[0_14px_35px_rgba(139,92,246,0.5)]'
  },
];

interface BannerSlide {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  ctaText?: string;
  bg?: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { settings } = useSettings();

  const wishlist = useSelector((state: RootState) => state.wishlist.items);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<any[]>([]);
  const [activePlayingVideo, setActivePlayingVideo] = useState<string | null>(null);

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

  // Fetch dynamic banners & videos from backend API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await api.get('/banners');
        if (res.data?.data && res.data.data.length > 0) {
          const apiSlides: BannerSlide[] = res.data.data.map((b: any) => ({
            title: b.title,
            subtitle: b.subtitle,
            imageUrl: b.imageUrl,
            linkUrl: b.linkUrl || '/catalog',
            ctaText: b.ctaText || 'Explore Catalog',
            bg: 'bg-gradient-to-r from-slate-900 to-primary-600'
          }));
          setBannerSlides(apiSlides);
        }
      } catch (err) {
        console.warn('Using default hero banners state');
      }
    };

    const fetchVideos = async () => {
      try {
        const res = await api.get('/videos');
        if (res.data?.data && res.data.data.length > 0) {
          setFeaturedVideos(res.data.data.slice(0, 3));
        }
      } catch (err) {
        console.warn('Using default videos state');
      }
    };

    const fetchFeatured = async () => {
      try {
        const res = await api.get('/products?isFeatured=true');
        if (res.data?.data) {
          setFeaturedProducts(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load featured products from backend:', err);
      }
    };

    fetchBanners();
    fetchVideos();
    fetchFeatured();
  }, [settings]);

  // Auto Banner Slide Timer (5 seconds)
  useEffect(() => {
    if (isPaused || bannerSlides.length <= 1) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, bannerSlides.length]);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % bannerSlides.length);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Slider Banner with Auto-Play & Admin Customization */}
      <section 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative overflow-hidden h-[480px] group rounded-3xl mx-4 sm:mx-6 lg:mx-8 shadow-2xl"
      >
        <div 
          className="absolute inset-0 flex transition-transform duration-700 ease-in-out h-full" 
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {bannerSlides.map((slide, idx) => (
            <div 
              key={idx} 
              className={`w-full h-full shrink-0 relative flex items-center justify-center text-white p-8 md:p-16 ${slide.bg || 'bg-slate-900'}`}
            >
              {/* Background Image with Dark Overlay */}
              {slide.imageUrl && (
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <img 
                    src={slide.imageUrl} 
                    alt={slide.title}
                    className="w-full h-full object-cover opacity-35 scale-105 transition-transform duration-1000"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                </div>
              )}

              {/* Banner Content */}
              <div className="max-w-4xl w-full space-y-6 text-left relative z-10 animate-fade-in">
                <span className="text-xs uppercase tracking-widest text-accent-gold font-bold bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-accent-gold/20 inline-block">
                  {settings.companyName || 'Enterprise Electronics'} Official Banner
                </span>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="text-sm md:text-lg text-slate-200 max-w-xl leading-relaxed drop-shadow">
                    {slide.subtitle}
                  </p>
                )}
                <div className="pt-4 flex flex-wrap gap-4">
                  <Link 
                    to={slide.linkUrl || '/catalog'} 
                    className="btn-primary bg-accent-blue hover:bg-accent-blue/90 text-white font-bold px-7 py-3 text-sm rounded-xl shadow-lg shadow-accent-blue/30 flex items-center gap-2"
                  >
                    {slide.ctaText || 'Explore Catalog'} <ArrowRight size={16} />
                  </Link>
                  <Link 
                    to="/corporate-enquiry" 
                    className="btn-secondary bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 px-6 py-3 text-sm font-bold rounded-xl"
                  >
                    Contact Enterprise Sales
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Previous & Next Control Buttons */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/40 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300"
          aria-label="Previous Slide"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={handleNextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/40 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300"
          aria-label="Next Slide"
        >
          <ChevronRight size={20} />
        </button>

        {/* Slider Indicator Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5 bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          {bannerSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${activeSlide === idx ? 'w-8 bg-accent-blue' : 'w-2.5 bg-white/40 hover:bg-white/70'}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-accent-blue font-extrabold block mb-1">Interactive Catalog</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Browse by Category</h2>
            <p className="text-sm text-slate-400 mt-1">Explore our high-performance hardware and software solutions.</p>
          </div>
          <Link to="/catalog" className="text-accent-blue text-sm font-bold flex items-center gap-1 hover:underline">
            All Categories <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                onClick={() => navigate(`/catalog?category=${encodeURIComponent(cat.categoryQuery || cat.name)}`)}
                className="glass-card p-6 md:p-8 flex flex-col items-center text-center cursor-pointer rounded-3xl border border-slate-200/60 dark:border-primary-500/30 hover:border-accent-blue/40 shadow-lg hover:shadow-2xl hover:-translate-y-2.5 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Background Ambient Glow */}
                <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br ${cat.gradient} opacity-10 group-hover:opacity-25 blur-xl transition-all duration-500`} />

                {/* 3D Icon Container */}
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${cat.gradient} text-white flex items-center justify-center mb-5 ${cat.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative border border-white/30 backdrop-blur-md`}>
                  {/* Glossy 3D Highlight Curve */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-3xl pointer-events-none" />
                  
                  <Icon size={42} className="drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)] transform group-hover:scale-105 transition-transform duration-300" />
                </div>

                <h3 className="font-extrabold text-base md:text-lg text-slate-800 dark:text-slate-100 group-hover:text-accent-blue transition-colors">
                  {cat.name}
                </h3>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-300 mt-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-primary-600/60">
                  {cat.count}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2.5 Video Demos & Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-accent-blue font-extrabold flex items-center gap-1.5 block mb-1">
              <Tv size={14} /> Video Showcase
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Product Demos & Tutorials</h2>
            <p className="text-sm text-slate-400 mt-1">Watch live demonstrations of POS software, CCTV installations, and hardware setups.</p>
          </div>
          <Link to="/videos" className="text-accent-blue text-sm font-bold flex items-center gap-1 hover:underline">
            All Video Demos <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredVideos.map((vid) => (
            <div
              key={vid._id || vid.id || vid.title}
              className="glass-card overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 rounded-3xl border border-slate-200/60 dark:border-primary-500/30 flex flex-col justify-between"
            >
              {/* Thumbnail Poster */}
              <div 
                className="relative h-48 bg-slate-950 overflow-hidden cursor-pointer"
                onClick={() => {
                  let url = vid.videoUrl || '';
                  if (url.includes('youtube.com/watch?v=')) {
                    url = `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0]}?autoplay=1`;
                  } else if (url.includes('youtu.be/')) {
                    url = `https://www.youtube.com/embed/${url.split('youtu.be/')[1]?.split('?')[0]}?autoplay=1`;
                  }
                  setActivePlayingVideo(url);
                }}
              >
                <img
                  src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent p-4 flex flex-col justify-between">
                  <span className="bg-slate-900/80 backdrop-blur-md text-accent-blue font-bold px-2.5 py-1 rounded-full text-[10px] border border-white/10 w-fit">
                    {vid.category || 'Product Demo'}
                  </span>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-blue to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-accent-blue/40 group-hover:scale-115 transition-all duration-300 border-2 border-white/40">
                      <Play size={24} className="ml-1 fill-white" />
                    </div>
                  </div>

                  <h3 className="text-white font-extrabold text-sm line-clamp-1 group-hover:text-accent-blue transition-colors">
                    {vid.title}
                  </h3>
                </div>
              </div>

              <div className="p-5 space-y-3 text-left">
                {vid.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {vid.description}
                  </p>
                )}
                <button
                  onClick={() => {
                    let url = vid.videoUrl || '';
                    if (url.includes('youtube.com/watch?v=')) {
                      url = `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0]}?autoplay=1`;
                    } else if (url.includes('youtu.be/')) {
                      url = `https://www.youtube.com/embed/${url.split('youtu.be/')[1]?.split('?')[0]}?autoplay=1`;
                    }
                    setActivePlayingVideo(url);
                  }}
                  className="btn-primary text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-accent-blue/20"
                >
                  <Play size={12} className="fill-white" /> Play Video Demo
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Video Modal Lightbox */}
      {activePlayingVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <button
              onClick={() => setActivePlayingVideo(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/80 text-white hover:bg-red-500 transition-colors border border-white/20"
              aria-label="Close Video Player"
            >
              <X size={20} />
            </button>
            <iframe
              src={activePlayingVideo}
              title="Video Player"
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* 3. Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Featured Solutions</h2>
            <p className="text-sm text-slate-400">Our highest rated systems and corporate favorites.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Corporate discounts applied automatically at checkout.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((prod) => {
            const prodId = prod.id || (prod as any)._id;
            return (
              <div
                key={prodId}
                className="glass-card overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => navigate(`/product/${prodId}`)}>
                  <img
                    src={prod.images[0]}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => toggleWishlist(e, prod)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/80 dark:bg-primary-600/80 backdrop-blur-sm shadow-sm transition-all hover:scale-110"
                  >
                    <Heart
                      size={16}
                      className={isInWishlist(prodId) ? 'fill-red-500 text-red-500' : 'text-slate-400 dark:text-slate-200'}
                    />
                  </button>
                  {prod.isBestSeller && (
                    <span className="absolute top-4 left-4 bg-accent-gold text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md">
                      Bestseller
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{typeof prod.brand === 'object' && prod.brand ? (prod.brand as any).name : prod.brand}</span>
                      <h3
                        className="font-bold text-base hover:text-accent-blue cursor-pointer line-clamp-1 transition-colors mt-0.5"
                        onClick={() => navigate(`/product/${prodId}`)}
                      >
                        {prod.name}
                      </h3>
                    </div>
                    <div className="flex items-center bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded text-xs font-semibold shrink-0">
                      <Star size={12} className="fill-current mr-0.5" />
                      {prod.ratingsAverage}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>

                  {/* Specs pills */}
                  <div className="flex flex-wrap gap-1">
                    {prod.specifications && prod.specifications.slice(0, 2).map((spec, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 dark:bg-primary-500 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {spec.value}
                      </span>
                    ))}
                  </div>

                  <hr className="border-slate-100 dark:border-primary-500" />

                  {/* Price and Add button */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400">Excl. GST</span>
                      <p className="font-extrabold text-lg text-primary-500 dark:text-primary-50">
                        INR {prod.basePrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/product/${prodId}`)}
                      className="btn-primary py-2 px-4 text-xs font-semibold rounded-xl flex items-center gap-1"
                    >
                      Learn More <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>



      {/* Industry Solutions Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white dark:from-primary-800 dark:to-primary-900 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Header */}
          <div className="text-center mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 bg-accent-blue/10 text-accent-blue text-xs font-bold px-4 py-1.5 rounded-full">
              <span>🏭</span> Industry-Specific Solutions
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-500 dark:text-primary-50">
              Accounting Software For<br className="hidden sm:block" />
              <span className="text-accent-blue"> Your Industry</span>
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              We understand that every industry has its own unique accounting &amp; business requirements, and our
              Accounting Software is designed to address them effectively.
            </p>
          </div>

          {/* Industries Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6">
            {[
              { icon: '🔩', label: 'Auto Parts', gradient: 'from-blue-600 to-slate-700', shadow: 'shadow-[0_10px_25px_rgba(37,99,235,0.35)]' },
              { icon: '🏪', label: 'Retail', gradient: 'from-emerald-500 to-teal-700', shadow: 'shadow-[0_10px_25px_rgba(16,185,129,0.35)]' },
              { icon: '🛒', label: 'Ecommerce', gradient: 'from-indigo-500 to-purple-700', shadow: 'shadow-[0_10px_25px_rgba(99,102,241,0.35)]' },
              { icon: '🏷️', label: 'FMCG', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-[0_10px_25px_rgba(245,158,11,0.35)]' },
              { icon: '🍽️', label: 'Food & Beverage', gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-[0_10px_25px_rgba(244,63,94,0.35)]' },
              { icon: '💾', label: 'Computer Hardware', gradient: 'from-cyan-500 to-blue-600', shadow: 'shadow-[0_10px_25px_rgba(6,182,212,0.35)]' },
              { icon: '🧪', label: 'Chemical', gradient: 'from-purple-500 to-violet-700', shadow: 'shadow-[0_10px_25px_rgba(168,85,247,0.35)]' },
              { icon: '⚡', label: 'Electrical Goods', gradient: 'from-amber-400 to-yellow-600', shadow: 'shadow-[0_10px_25px_rgba(251,191,36,0.35)]' },
              { icon: '📰', label: 'Paper', gradient: 'from-sky-500 to-blue-600', shadow: 'shadow-[0_10px_25px_rgba(14,165,233,0.35)]' },
              { icon: '✈️', label: 'Travel', gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-[0_10px_25px_rgba(59,130,246,0.35)]' },
              { icon: '🛋️', label: 'Furniture', gradient: 'from-amber-600 to-orange-800', shadow: 'shadow-[0_10px_25px_rgba(217,119,6,0.35)]' },
              { icon: '💊', label: 'Pharma', gradient: 'from-teal-500 to-emerald-600', shadow: 'shadow-[0_10px_25px_rgba(20,184,166,0.35)]' },
              { icon: '🎨', label: 'Paint', gradient: 'from-pink-500 to-rose-600', shadow: 'shadow-[0_10px_25px_rgba(236,72,153,0.35)]' },
              { icon: '📱', label: 'Mobile Store', gradient: 'from-violet-500 to-indigo-700', shadow: 'shadow-[0_10px_25px_rgba(139,92,246,0.35)]' },
              { icon: '👗', label: 'Garments', gradient: 'from-fuchsia-500 to-pink-600', shadow: 'shadow-[0_10px_25px_rgba(217,70,239,0.35)]' },
              { icon: '💎', label: 'Gems & Jewellery', gradient: 'from-cyan-400 to-emerald-600', shadow: 'shadow-[0_10px_25px_rgba(34,211,238,0.35)]' },
              { icon: '🌾', label: 'Agriculture', gradient: 'from-green-500 to-emerald-700', shadow: 'shadow-[0_10px_25px_rgba(34,197,94,0.35)]' },
              { icon: '✏️', label: 'Stationery', gradient: 'from-orange-400 to-red-500', shadow: 'shadow-[0_10px_25px_rgba(251,146,60,0.35)]' },
              { icon: '🏗️', label: 'Construction', gradient: 'from-stone-500 to-slate-700', shadow: 'shadow-[0_10px_25px_rgba(120,113,108,0.35)]' },
              { icon: '🏥', label: 'Healthcare', gradient: 'from-red-500 to-rose-600', shadow: 'shadow-[0_10px_25px_rgba(239,68,68,0.35)]' },
            ].map((industry) => (
              <div
                key={industry.label}
                onClick={() => navigate(`/catalog?category=Billing+Software`)}
                className="group relative flex flex-col items-center justify-center p-5 md:p-6 bg-white dark:bg-primary-700/90 rounded-3xl border border-slate-200/60 dark:border-primary-500/30 shadow-md hover:shadow-xl hover:border-accent-blue/40 hover:-translate-y-2 transition-all duration-300 cursor-pointer text-center overflow-hidden"
              >
                {/* Background Ambient Glow */}
                <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full bg-gradient-to-br ${industry.gradient} opacity-10 group-hover:opacity-25 blur-lg transition-all duration-500`} />

                {/* 3D Icon Container Badge */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${industry.gradient} text-white flex items-center justify-center mb-3.5 ${industry.shadow} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative border border-white/30 backdrop-blur-md shrink-0`}>
                  {/* Glossy 3D Highlight Curve */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-t-2xl sm:rounded-t-3xl pointer-events-none" />

                  <span className="text-3xl sm:text-4xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] transform group-hover:scale-105 transition-transform duration-300 relative z-10">
                    {industry.icon}
                  </span>
                </div>

                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-accent-blue transition-colors duration-200 leading-tight relative z-10">
                  {industry.label}
                </span>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-6 right-6 h-1 bg-accent-blue rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12 space-y-3">
            <p className="text-xs text-slate-400">Don't see your industry? We offer custom configurations for any business vertical.</p>
            <Link
              to="/catalog?category=Billing+Software"
              className="inline-flex items-center gap-2 btn-primary py-3 px-8 rounded-2xl text-sm font-bold shadow-md shadow-accent-blue/20 hover:shadow-lg hover:shadow-accent-blue/30 transition-all"
            >
              Explore Billing Software <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="bg-white dark:bg-primary-700 py-12 border-y border-slate-200/50 dark:border-primary-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent-blue/10 dark:bg-primary-600 rounded-xl text-accent-blue">
              <TrendingUp size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm">Corporate B2B GST Pricing</h3>
              <p className="text-xs text-slate-400 dark:text-slate-300 mt-1 leading-relaxed">
                Provide your corporate GSTIN during checkout and download compliant business invoices automatically. Claim tax credits instantly.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent-blue/10 dark:bg-primary-600 rounded-xl text-accent-blue">
              <ShieldCheck size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm">Authorized Warranty &amp; Setup</h3>
              <p className="text-xs text-slate-400 dark:text-slate-300 mt-1 leading-relaxed">
                We are certified partners for Lenovo, Hikvision, Cisco, HP, and Corsair. All hardware comes with direct manufacturer warranty support.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent-blue/10 dark:bg-primary-600 rounded-xl text-accent-blue">
              <Clock size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm">24/7 Enterprise Helpdesk</h3>
              <p className="text-xs text-slate-400 dark:text-slate-300 mt-1 leading-relaxed">
                Dedicated support system for IT service agreements, billing software upgrades, and remote CCTV configurations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">What Our Partners Say</h2>
          <p className="text-sm text-slate-400">Trusted by over 500+ small businesses and IT managers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="glass-card p-6 space-y-4 rounded-3xl border border-slate-200/60 dark:border-primary-500/30">
            <div className="flex text-yellow-400">
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 italic leading-relaxed">
              "We migrated all our branch accounting to Enterprise Billing Software. The POS printing configuration works seamlessly, and our compliance logs are fully automated now."
            </p>
            <div>
              <p className="font-bold text-xs sm:text-sm text-primary-500 dark:text-primary-50">Rajesh Kumar</p>
              <p className="text-[10px] sm:text-xs text-slate-400">Director, K-Retail Chains</p>
            </div>
          </div>
          <div className="glass-card p-6 space-y-4 rounded-3xl border border-slate-200/60 dark:border-primary-500/30">
            <div className="flex text-yellow-400">
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 italic leading-relaxed">
              "Purchased dome and bullet CCTV systems for our 3-floor facility. Excellent day/night video resolution. The support team configured our remote mobile monitoring within 2 hours."
            </p>
            <div>
              <p className="font-bold text-xs sm:text-sm text-primary-500 dark:text-primary-50">Sneha Sharma</p>
              <p className="text-[10px] sm:text-xs text-slate-400">Head of Security, Zenith TechLabs</p>
            </div>
          </div>
          <div className="glass-card p-6 space-y-4 rounded-3xl border border-slate-200/60 dark:border-primary-500/30">
            <div className="flex text-yellow-400">
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 italic leading-relaxed">
              "Outstanding procurement experience. Ordered 15 ThinkPad laptops and Cisco switches. The bulk pricing discount we received was unmatched. Standardizing on Elevate Technology."
            </p>
            <div>
              <p className="font-bold text-xs sm:text-sm text-primary-500 dark:text-primary-50">Arjun Patel</p>
              <p className="text-[10px] sm:text-xs text-slate-400">Chief Information Officer, Alpha Solutions</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
