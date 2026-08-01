import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';
import { toggleTheme } from '../store/themeSlice';
import api from '../services/api';
import { useToast } from '../utils/ToastContext';
import {
  LayoutDashboard,
  Box,
  Tags,
  ShieldCheck,
  ShoppingBag,
  KeyRound,
  LifeBuoy,
  History,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  User as UserIcon,
  Home,
  Users,
  Bell,
  CheckCheck,
  Package,
  Ticket,
  Image
} from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const toast = useToast();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isLinkActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Base prefix depending on role
  const basePrefix = user?.role === 'admin' ? '/admin' : '/employee';

  const sidebarLinks = [
    { name: 'Overview', path: `${basePrefix}`, icon: LayoutDashboard },
    { name: 'Products', path: `${basePrefix}/products`, icon: Box },
    { name: 'Categories', path: `${basePrefix}/categories`, icon: Tags },
    { name: 'Orders', path: `${basePrefix}/orders`, icon: ShoppingBag },
    { name: 'Licenses', path: `${basePrefix}/licenses`, icon: KeyRound },
    { name: 'Support Tickets', path: `${basePrefix}/tickets`, icon: LifeBuoy },
  ];

  // Admin-only Dashboard Links
  if (user?.role === 'admin') {
    sidebarLinks.push(
      { name: 'Banner Sliders', path: '/admin/banners', icon: Image },
      { name: 'Staff Management', path: '/admin/employees', icon: ShieldCheck },
      { name: 'User Management', path: '/admin/users', icon: Users },
      { name: 'Audit Logs', path: '/admin/logs', icon: History },
      { name: 'System Settings', path: '/admin/settings', icon: Settings }
    );
  }

  // Fetch notifications for admin/employee
  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.data) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Silently fail — offline or not admin
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'employee') {
      loadNotifications();

      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const eventSource = new EventSource(`${API_URL}/notifications/stream?token=${token}`);

      eventSource.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data);
          setNotifications((prev) => {
            if (prev.some((n) => n._id === newNotif._id)) return prev;
            return [newNotif, ...prev];
          });
          setUnreadCount((prev) => prev + 1);
          
          // Display real-time toast notification
          toast.success(newNotif.title, newNotif.message);

          // Dispatch custom events based on notification content to sync UI in real-time
          const titleLower = newNotif.title.toLowerCase();
          const messageLower = newNotif.message.toLowerCase();
          if (titleLower.includes('order') || messageLower.includes('order')) {
            window.dispatchEvent(new CustomEvent('realtime-order-update', { detail: newNotif }));
          }
          if (titleLower.includes('ticket') || messageLower.includes('ticket') || titleLower.includes('reply') || messageLower.includes('reply')) {
            window.dispatchEvent(new CustomEvent('realtime-ticket-update', { detail: newNotif }));
          }
        } catch (err) {
          console.error('Failed to parse real-time notification:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Connection Error:', err);
      };

      return () => {
        eventSource.close();
      };
    }
  }, [user?.role]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const handleMarkOneRead = async (id: string, linkUrl?: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch { /* offline */ }
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    if (linkUrl) {
      setNotifOpen(false);
      navigate(linkUrl);
    }
  };

  const getNotifIcon = (title: string) => {
    if (title.toLowerCase().includes('order')) return <Package size={14} className="text-accent-blue shrink-0" />;
    return <Ticket size={14} className="text-purple-500 shrink-0" />;
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${mode === 'dark' ? 'bg-primary-800 text-primary-50' : 'bg-slate-50 text-primary-500'}`}>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-primary-700 border-r border-slate-200/50 dark:border-primary-500/20 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div>
          {/* Logo & Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-primary-500/20">
            <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
              <Box className="text-accent-blue" size={22} />
              <span>{user?.role === 'admin' ? 'Admin' : 'Staff'} <span className="text-accent-blue">Panel</span></span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-primary-500 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const active = isLinkActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-accent-blue text-white shadow-md shadow-accent-blue/20' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-primary-600'}`}
                >
                  <Icon size={18} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-slate-200/50 dark:border-primary-500/20 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-primary-600"
          >
            <Home size={18} />
            <span>Go to Shop Website</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-primary-600/30 transition-all duration-200"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-primary-700 border-b border-slate-200/50 dark:border-primary-500/20 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1 text-slate-400 hover:text-primary-500 lg:hidden"
            >
              <Menu size={22} />
            </button>
            <h1 className="font-semibold text-lg capitalize">
              {location.pathname.split('/').pop() || 'Overview'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => dispatch(toggleTheme())}
              className="text-primary-400 hover:text-accent-blue p-2 rounded-lg"
            >
              {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell — admin/employee only */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(o => !o); if (!notifOpen) loadNotifications(); }}
                className="relative p-2 rounded-lg text-slate-400 hover:text-accent-blue hover:bg-accent-blue/10 transition-all"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center px-0.5 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/20 overflow-hidden z-50 animate-fade-in">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-primary-500/20 bg-slate-50 dark:bg-primary-700/60">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <Bell size={13} className="text-accent-blue" />
                      Notifications {unreadCount > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold">{unreadCount}</span>}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-accent-blue font-semibold hover:underline flex items-center gap-1"
                      >
                        <CheckCheck size={11} /> Mark All Read
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        <Bell size={24} className="mx-auto mb-2 opacity-30" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif._id}
                          onClick={() => handleMarkOneRead(notif._id, notif.linkUrl)}
                          className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-slate-50 dark:border-primary-600/30 last:border-none transition-colors hover:bg-slate-50 dark:hover:bg-primary-600/20 ${!notif.isRead ? 'bg-accent-blue/5' : ''}`}
                        >
                          <div className="mt-0.5">
                            {getNotifIcon(notif.title)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${!notif.isRead ? 'text-primary-500 dark:text-primary-50' : 'text-slate-400'}`}>
                              {notif.title}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                            <p className="text-[9px] text-slate-300 dark:text-slate-500 mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-accent-blue shrink-0 mt-1" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-primary-500/20" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-blue/15 text-accent-blue flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || <UserIcon size={16} />}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold">{user?.name || 'Staff Member'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.role || 'Employee'}</p>
              </div>
            </div>
          </div>

        </header>

        {/* Dashboard Content Container */}
        <div className="p-6 max-w-7xl w-full mx-auto animate-fade-in flex-1">
          <Outlet />
        </div>
      </div>

    </div>
  );
};

export default DashboardLayout;
