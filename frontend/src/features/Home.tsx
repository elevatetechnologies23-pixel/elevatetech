import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MOCK_PRODUCTS } from '../utils/mockData';
import api from '../services/api';
import type { ProductItem } from '../utils/mockData';
import type { RootState } from '../store';
import { addToWishlist, removeFromWishlist } from '../store/wishlistSlice';
import { useToast } from '../utils/ToastContext';
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
  Heart
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Laptop', icon: Laptop, count: '15+ Models' },
  { name: 'CCTV Camera', icon: ShieldCheck, count: '30+ Models' },
  { name: 'Billing Software', icon: Settings, count: '3 Versions' },
  { name: 'Networking', icon: Layers, count: '45+ Items' },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const wishlist = useSelector((state: RootState) => state.wishlist.items);
  const [activeSlide, setActiveSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>(MOCK_PRODUCTS.filter(p => p.isFeatured));

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

  useEffect(() => {
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
    fetchFeatured();
  }, []);

  const slides = [
    {
      title: 'Next-Gen IT Infrastructure Solutions',
      subtitle: 'Premium Enterprise Computers, Networking & Security Systems',
      cta: 'Explore Catalog',
      link: '/catalog',
      bg: 'bg-gradient-to-r from-slate-900 to-primary-500'
    },
    {
      title: 'Smart CCTV Camera Installations',
      subtitle: 'Complete Surveillance Solutions for Offices & Warehouses',
      cta: 'Request Free Quote',
      link: '/corporate-enquiry',
      bg: 'bg-gradient-to-r from-blue-900 to-accent-blue'
    },
    {
      title: 'Advanced POS & Billing Software',
      subtitle: 'Automate Billing, Inventory Control & GST Filings Easily',
      cta: 'View Pricing Plans',
      link: '/billing-software',
      bg: 'bg-gradient-to-r from-slate-800 to-accent-gold'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Slider Banner */}
      <section className="relative overflow-hidden h-[450px]">
        <div className="absolute inset-0 flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
          {slides.map((slide, idx) => (
            <div key={idx} className={`w-full h-full shrink-0 flex items-center justify-center text-white p-8 md:p-16 ${slide.bg}`}>
              <div className="max-w-4xl w-full space-y-6 text-left animate-fade-in">
                <span className="text-xs uppercase tracking-widest text-accent-gold font-bold">Evevate Technology Solutions</span>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">{slide.title}</h1>
                <p className="text-sm md:text-lg text-slate-300 max-w-xl">{slide.subtitle}</p>
                <div className="pt-4 flex gap-4">
                  <Link to={slide.link} className="btn-primary bg-white text-primary-500 hover:bg-slate-100 font-semibold px-6 py-3 text-sm">
                    {slide.cta}
                  </Link>
                  <Link to="/corporate-enquiry" className="btn-secondary bg-transparent border border-white/30 text-white hover:bg-white/10 px-6 py-3 text-sm">
                    Contact Sales
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slider dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all ${activeSlide === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Browse by Category</h2>
            <p className="text-sm text-slate-400">Curated hardware and software solutions for your operations.</p>
          </div>
          <Link to="/catalog" className="text-accent-blue text-sm font-semibold flex items-center gap-1 hover:underline">
            All Categories <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                onClick={() => navigate(`/catalog?category=${encodeURIComponent(cat.name)}`)}
                className="glass-card p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 dark:bg-primary-500 text-accent-blue flex items-center justify-center mb-4">
                  <Icon size={24} />
                </div>
                <h3 className="font-semibold text-sm">{cat.name}</h3>
                <span className="text-xs text-slate-400 mt-1">{cat.count}</span>
              </div>
            );
          })}
        </div>
      </section>

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

      {/* 4. Value Propositions */}
      <section className="bg-white dark:bg-primary-700 py-12 border-y border-slate-200/50 dark:border-primary-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent-blue/10 dark:bg-primary-600 rounded-xl text-accent-blue">
              <TrendingUp size={24} />
            </div>
            <div>
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
            <div>
              <h3 className="font-bold text-sm">Authorized Warranty & Setup</h3>
              <p className="text-xs text-slate-400 dark:text-slate-300 mt-1 leading-relaxed">
                We are certified partners for Lenovo, Hikvision, Cisco, HP, and Corsair. All hardware comes with direct manufacturer warranty support.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent-blue/10 dark:bg-primary-600 rounded-xl text-accent-blue">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm">24/7 Enterprise Helpdesk</h3>
              <p className="text-xs text-slate-400 dark:text-slate-300 mt-1 leading-relaxed">
                Dedicated support system for IT service agreements, billing software upgrades, and remote CCTV configurations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl font-bold tracking-tight">What Our Partners Say</h2>
          <p className="text-sm text-slate-400 mt-2">Trusted by over 500+ small businesses and IT managers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 space-y-4">
            <div className="flex text-yellow-400">
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-300 italic">
              "We migrated all our branch accounting to Enterprise Billing Software. The POS printing configuration works seamlessly, and our compliance logs are fully automated now."
            </p>
            <div>
              <p className="font-bold text-xs">Rajesh Kumar</p>
              <p className="text-[10px] text-slate-400">Director, K-Retail Chains</p>
            </div>
          </div>
          <div className="glass-card p-6 space-y-4">
            <div className="flex text-yellow-400">
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-300 italic">
              "Purchased dome and bullet CCTV systems for our 3-floor facility. Excellent day/night video resolution. The support team configured our remote mobile monitoring within 2 hours."
            </p>
            <div>
              <p className="font-bold text-xs">Sneha Sharma</p>
              <p className="text-[10px] text-slate-400">Head of Security, Zenith TechLabs</p>
            </div>
          </div>
          <div className="glass-card p-6 space-y-4">
            <div className="flex text-yellow-400">
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
              <Star size={16} className="fill-current" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-300 italic">
              "Outstanding procurement experience. Ordered 15 ThinkPad laptops and Cisco switches. The bulk pricing discount we received was unmatched. Standardizing on Elevate Technology."
            </p>
            <div>
              <p className="font-bold text-xs">Arjun Patel</p>
              <p className="text-[10px] text-slate-400">Chief Information Officer, Alpha Solutions</p>
            </div>
          </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { icon: '🔩', label: 'Auto Parts' },
              { icon: '🏪', label: 'Retail' },
              { icon: '🛒', label: 'Ecommerce' },
              { icon: '🏷️', label: 'FMCG' },
              { icon: '🍽️', label: 'Food & Beverage' },
              { icon: '💾', label: 'Computer Hardware' },
              { icon: '🧪', label: 'Chemical' },
              { icon: '⚡', label: 'Electrical Goods' },
              { icon: '📰', label: 'Paper' },
              { icon: '✈️', label: 'Travel' },
              { icon: '🛋️', label: 'Furniture' },
              { icon: '💊', label: 'Pharma' },
              { icon: '🎨', label: 'Paint' },
              { icon: '📱', label: 'Mobile Store' },
              { icon: '👗', label: 'Garments' },
              { icon: '💎', label: 'Gems & Jewellery' },
              { icon: '🌾', label: 'Agriculture' },
              { icon: '✏️', label: 'Stationery' },
              { icon: '🏗️', label: 'Construction' },
              { icon: '🏥', label: 'Healthcare' },
            ].map((industry) => (
              <div
                key={industry.label}
                className="group relative flex flex-col items-center justify-center gap-3 p-5 bg-white dark:bg-primary-700 rounded-2xl border border-slate-100 dark:border-primary-500/20 shadow-sm hover:shadow-lg hover:border-accent-blue/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <span className="text-3xl group-hover:scale-110 transition-transform duration-300 relative z-10">
                  {industry.icon}
                </span>
                <span className="text-xs font-semibold text-primary-500 dark:text-primary-100 group-hover:text-accent-blue transition-colors duration-200 leading-tight relative z-10">
                  {industry.label}
                </span>

                {/* Bottom accent bar */}
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent-blue rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
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
    </div>
  );
};

export default Home;
