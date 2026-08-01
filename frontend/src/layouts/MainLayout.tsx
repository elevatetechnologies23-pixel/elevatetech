import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';
import { toggleTheme } from '../store/themeSlice';
import {
  ShoppingCart,
  User as UserIcon,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Heart
} from 'lucide-react';
import { useToast } from '../utils/ToastContext';
import { useSettings } from '../utils/SettingsContext';
import WishlistDrawer from './WishlistDrawer';
import Logo from '../components/Logo';
import SocialMediaLinks from '../components/SocialMediaLinks';
import SupportChatbot from '../components/SupportChatbot';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { totalQuantity } = useSelector((state: RootState) => state.cart);
  const { mode } = useSelector((state: RootState) => state.theme);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const toast = useToast();

  // Synchronize document theme class on mount
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [profileDropdownOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.info('Signed Out', 'You have been logged out successfully.');
    navigate('/login');
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${mode === 'dark' ? 'bg-primary-800 text-primary-50' : 'bg-slate-50 text-primary-500'}`}>
      {/* Top Banner Contact Bar */}
      <div className="bg-primary-500 text-primary-100 text-xs py-2 px-4 border-b border-primary-400/20 dark:bg-primary-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone size={12} /> {settings.companyPhone || '+91 9673391008'}</span>
            <span className="flex items-center gap-1"><Mail size={12} /> {settings.companyEmail || 'enterprise@electronics.com'}</span>
          </div>
          <div className="flex items-center gap-4">
            <SocialMediaLinks size="sm" />
            <span className="text-white/20">|</span>
            <Link to="/corporate-enquiry" className="hover:text-accent-blue transition-colors">Corporate Enquiry</Link>
            <Link to="/compare" className="hover:text-accent-blue transition-colors">Compare Products</Link>
            <Link to="/billing-software" className="hover:text-accent-blue transition-colors font-medium text-accent-gold">Billing Software</Link>
          </div>
        </div>
      </div>

      {/* Main Glassmorphic Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-primary-600/80 backdrop-blur-md border-b border-slate-200/50 dark:border-primary-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo size="md" />
          </Link>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search products, models, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-primary-700 text-sm pl-4 pr-10 py-2 rounded-full border-none focus:ring-2 focus:ring-accent-blue/30 focus:bg-white dark:focus:bg-primary-600 transition-all outline-none"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-accent-blue">
              <Search size={16} />
            </button>
          </form>

          {/* Desktop Right Navigation Actions */}
          <div className="hidden lg:flex items-center gap-6">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="text-primary-400 hover:text-accent-blue transition-colors p-2"
              aria-label="Toggle Theme"
            >
              {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => setWishlistOpen(true)}
              className="relative p-2 text-primary-400 hover:text-accent-blue transition-colors"
              aria-label="Open Wishlist"
            >
              <Heart size={20} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold border border-white dark:border-primary-600">
                  {wishlistItems.length}
                </span>
              )}
            </button>

            <Link to="/cart" className="relative p-2 text-primary-400 hover:text-accent-blue transition-colors">
              <ShoppingCart size={20} />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent-blue text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {totalQuantity}
                </span>
              )}
            </Link>

            {isAuthenticated && user ? (
              <div className="relative profile-dropdown-container">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 text-sm font-medium hover:text-accent-blue transition-colors focus:outline-none"
                >
                  <UserIcon size={18} />
                  <span>{user.name}</span>
                </button>
                <div className={`absolute right-0 mt-2 w-48 bg-white dark:bg-primary-600 border border-slate-200 dark:border-primary-500 rounded-xl shadow-lg py-2 ${profileDropdownOpen ? 'block' : 'hidden'} animate-fade-in`}>
                  <Link to="/dashboard" onClick={() => setProfileDropdownOpen(false)} className="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-primary-500">My Dashboard</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-accent-blue hover:bg-slate-100 dark:hover:bg-primary-500 font-semibold">Admin Panel</Link>
                  )}
                  {user.role === 'employee' && (
                    <Link to="/employee" onClick={() => setProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-accent-gold hover:bg-slate-100 dark:hover:bg-primary-500 font-semibold">Staff Panel</Link>
                  )}
                  <hr className="my-1 border-slate-100 dark:border-primary-500" />
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-slate-100 dark:hover:bg-primary-500"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-primary py-2 px-4 text-sm">
                <UserIcon size={16} />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Buttons */}
          <div className="flex items-center lg:hidden gap-3">
            <button
              onClick={() => dispatch(toggleTheme())}
              className="text-primary-400 hover:text-accent-blue p-1.5"
            >
              {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile Wishlist Button */}
            <button
              onClick={() => setWishlistOpen(true)}
              className="relative p-1.5 text-primary-400 hover:text-accent-blue"
              aria-label="Open Wishlist"
            >
              <Heart size={18} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white dark:border-primary-600">
                  {wishlistItems.length}
                </span>
              )}
            </button>

            <Link to="/cart" className="relative p-1.5 text-primary-400 hover:text-accent-blue">
              <ShoppingCart size={18} />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent-blue text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {totalQuantity}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-primary-400 hover:text-accent-blue p-1.5"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-primary-500 bg-white dark:bg-primary-600 px-4 py-4 space-y-4 shadow-inner">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-primary-700 text-sm pl-4 pr-10 py-2 rounded-xl outline-none"
              />
              <button type="submit" className="absolute right-3 top-2 text-slate-400">
                <Search size={16} />
              </button>
            </form>

            <nav className="flex flex-col gap-3 font-medium">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent-blue">Home</Link>
              <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent-blue">Shop Products</Link>
              <Link to="/billing-software" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent-blue">Billing Software</Link>
              <Link to="/corporate-enquiry" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent-blue">Corporate enquiry</Link>

              <hr className="border-slate-200 dark:border-primary-500" />

              {isAuthenticated && user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent-blue">My Dashboard ({user.name})</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-accent-blue">Admin Panel</Link>
                  )}
                  {user.role === 'employee' && (
                    <Link to="/employee" onClick={() => setMobileMenuOpen(false)} className="text-accent-gold">Staff Panel</Link>
                  )}
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-left text-red-500 hover:text-red-600">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-primary w-full py-2">
                  <UserIcon size={16} />
                  <span>Login / Register</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Page Layout Wrapper */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Modern Premium Footer */}
      <footer className="bg-white dark:bg-primary-700 border-t border-slate-200/50 dark:border-primary-500/20 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <Logo size="md" showTagline={true} />
            </Link>
            <p className="text-sm text-slate-400 dark:text-slate-300 leading-relaxed">
              Premium IT infrastructure solutions, advanced CCTV security systems, robust networking setups, and billing automation software for modern enterprises.
            </p>
            <div className="flex flex-col gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-2"><MapPin size={14} className="text-accent-blue" /> {settings.companyAddress}</span>
              <span className="flex items-center gap-2"><Phone size={14} className="text-accent-blue" /> {settings.companyPhone}</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-primary-400">Products</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-300">
              <li><Link to="/catalog?category=Laptop" className="hover:text-accent-blue">Computers & Laptops</Link></li>
              <li><Link to="/catalog?category=CCTV%20Camera" className="hover:text-accent-blue">CCTV Cameras & Solutions</Link></li>
              <li><Link to="/catalog?category=Router" className="hover:text-accent-blue">Routers & Networking</Link></li>
              <li><Link to="/catalog?category=Printer" className="hover:text-accent-blue">Printers & Scanners</Link></li>
              <li><Link to="/catalog?category=POS%20Machine" className="hover:text-accent-blue">POS & Billing Terminals</Link></li>
            </ul>
          </div>

          {/* Col 3: Support & Resources */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-primary-400">Support</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-300">
              <li><Link to="/support-tickets" className="hover:text-accent-blue">Submit Ticket</Link></li>
              <li><Link to="/faq" className="hover:text-accent-blue">Frequently Asked Questions</Link></li>
              <li><Link to="/corporate-enquiry" className="hover:text-accent-blue">Request Quote</Link></li>
              <li><Link to="/blog" className="hover:text-accent-blue">IT Services Blog</Link></li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-primary-400">Stay Updated</h4>
            <p className="text-xs text-slate-400 dark:text-slate-300">
              Subscribe to receive updates on corporate pricing, software updates, and new arrivals.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Work Email"
                required
                className="px-3 py-2 bg-slate-100 dark:bg-primary-600 text-xs rounded-lg outline-none w-full focus:ring-1 focus:ring-accent-blue"
              />
              <button type="submit" className="btn-primary text-xs py-2 px-3 rounded-lg">Join</button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-200/50 dark:border-primary-500/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} {settings.companyName}. All rights reserved.</span>
          <SocialMediaLinks size="md" />
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
          </div>
        </div>
      </footer>

      <WishlistDrawer isOpen={wishlistOpen} onClose={() => setWishlistOpen(false)} />
      
      {/* Dynamic AI Support Chatbot Widget */}
      <SupportChatbot />
    </div>
  );
};

export default MainLayout;
