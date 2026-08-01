import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import type { RootState } from '../store';
import api from '../services/api';
import {
  ShoppingBag,
  KeyRound,
  LifeBuoy,
  User as UserIcon,
  Download,
  Send,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Bell,
  CheckCheck
} from 'lucide-react';
import { useToast } from '../utils/ToastContext';

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const toast = useToast();

  // Tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'licenses' | 'tickets' | 'notifications'>('orders');

  // Content States
  const [orders, setOrders] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [macInputs, setMacInputs] = useState<Record<string, string>>({});
  const [licenseActionLoading, setLicenseActionLoading] = useState<string | null>(null);

  // Ticket create inputs
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'general' | 'technical' | 'billing' | 'sales'>('general');
  const [newTicketPriority, setNewTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [ticketSubmitSuccess, setTicketSubmitSuccess] = useState(false);

  // Active ticket chat view
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);

  // Auto-redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch orders, licenses, and tickets
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setDataLoading(true);
      setOrdersError(null);

      // 1. Fetch Orders
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.data?.data || []);
      } catch (err: any) {
        console.error('Orders fetch error:', err.message);
        setOrdersError(err.message || 'Failed to load orders');
        setOrders([]);
      }

      // 2. Fetch Licenses
      try {
        const res = await api.get('/licenses/my-licenses');
        setLicenses(res.data?.data || []);
      } catch {
        setLicenses([]);
      }

      // 3. Fetch Support Tickets
      try {
        const res = await api.get('/tickets/my-tickets');
        setTickets(res.data?.data || []);
      } catch {
        setTickets([]);
      }

      // 4. Fetch Notifications
      try {
        const res = await api.get('/notifications');
        if (res.data?.data) {
          setNotifications(res.data.data);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch {
        setNotifications([]);
      }

      setDataLoading(false);
    };

    fetchData();
  }, [isAuthenticated, ticketSubmitSuccess]);

  // Real-time notifications SSE stream
  useEffect(() => {
    if (!isAuthenticated) return;

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

        // Display toast alert
        toast.info(newNotif.title, newNotif.message);

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
      console.error('Customer SSE Connection Error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [isAuthenticated]);

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const handleMarkOneNotificationRead = async (id: string, linkUrl?: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch { /* offline */ }
    setNotifications(prev => prev.map(n => (n._id || n.id) === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    if (linkUrl) {
      if (linkUrl.includes('ticket') || linkUrl.includes('support')) {
        setActiveTab('tickets');
      } else {
        setActiveTab('orders');
      }
    }
  };

  // Listen for real-time order/ticket updates to refresh dashboard collections in real-time
  useEffect(() => {
    const handleOrderUpdate = () => {
      api.get('/orders/my-orders')
        .then(res => setOrders(res.data?.data || []))
        .catch(() => {});
    };

    const handleTicketUpdate = () => {
      api.get('/tickets/my-tickets')
        .then(res => {
          const updatedTickets = res.data?.data || [];
          setTickets(updatedTickets);
          // If the customer currently has a ticket chat thread open, update the chat history live
          if (selectedTicket) {
            const freshTicket = updatedTickets.find((t: any) => t.ticketNumber === selectedTicket.ticketNumber);
            if (freshTicket) {
              api.get(`/tickets/details/${selectedTicket.ticketNumber}`)
                .then(detailsRes => {
                  if (detailsRes.data?.data) {
                    setSelectedTicket(detailsRes.data.data);
                  } else {
                    setSelectedTicket(freshTicket);
                  }
                })
                .catch(() => {
                  setSelectedTicket(freshTicket);
                });
            }
          }
        })
        .catch(() => {});
    };

    window.addEventListener('realtime-order-update', handleOrderUpdate);
    window.addEventListener('realtime-ticket-update', handleTicketUpdate);

    return () => {
      window.removeEventListener('realtime-order-update', handleOrderUpdate);
      window.removeEventListener('realtime-ticket-update', handleTicketUpdate);
    };
  }, [selectedTicket]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject || !newTicketDesc) return;

    try {
      await api.post('/tickets', {
        subject: newTicketSubject,
        description: newTicketDesc,
        category: newTicketCategory,
        priority: newTicketPriority
      });
      setTicketSubmitSuccess(true);
      setNewTicketSubject('');
      setNewTicketDesc('');
      toast.success('Ticket Created!', `Your support request has been submitted.`);
      setTimeout(() => setTicketSubmitSuccess(false), 3000);
    } catch {
      // Simulate local add
      const mockTicket = {
        ticketNumber: 'TCK-' + Math.floor(100000 + Math.random() * 900000).toString(),
        subject: newTicketSubject,
        category: newTicketCategory,
        priority: newTicketPriority,
        status: 'open',
        updatedAt: new Date().toISOString(),
        messages: [{ sender: { name: 'You' }, message: newTicketDesc }]
      };
      setTickets([mockTicket, ...tickets]);
      setTicketSubmitSuccess(true);
      setNewTicketSubject('');
      setNewTicketDesc('');
      toast.success('Ticket Created!', 'Your support request has been submitted.');
      setTimeout(() => setTicketSubmitSuccess(false), 3000);
    }
  };

  const handleSendTicketMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage || !selectedTicket) return;

    try {
      const res = await api.post(`/tickets/details/${selectedTicket.ticketNumber}/messages`, { message: chatMessage });
      if (res.data?.data) {
        setSelectedTicket(res.data.data);
        setChatMessage('');
        toast.success('Message Sent', 'Your reply has been added to the ticket.');
      }
    } catch {
      // Simulate local chat append
      const updatedMessages = [...selectedTicket.messages, { sender: { name: user?.name || 'You' }, message: chatMessage, createdAt: new Date().toISOString() }];
      const updatedTicket = { ...selectedTicket, messages: updatedMessages };
      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => t.ticketNumber === selectedTicket.ticketNumber ? updatedTicket : t));
      setChatMessage('');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'shipped' || status === 'delivered' || status === 'paid' || status === 'active' || status === 'resolved') {
      return <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] font-semibold capitalize flex items-center gap-1 w-fit"><CheckCircle size={10} /> {status}</span>;
    }
    if (status === 'placed' || status === 'processing' || status === 'pending' || status === 'open' || status === 'in-progress') {
      return <span className="bg-blue-500/10 text-accent-blue px-2 py-0.5 rounded text-[10px] font-semibold capitalize flex items-center gap-1 w-fit"><Clock size={10} /> {status}</span>;
    }
    return <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-semibold capitalize flex items-center gap-1 w-fit"><AlertTriangle size={10} /> {status}</span>;
  };

  const downloadMockInvoice = (orderNo: string) => {
    const token = localStorage.getItem('accessToken') || '';
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    window.open(`${apiUrl}/orders/invoice/${orderNo}/download?token=${encodeURIComponent(token)}&_cb=${Date.now()}`, '_blank');
  };

  const renderStatusStepper = (ord: any) => {
    const status = ord.orderStatus;
    if (['cancelled', 'returned'].includes(status)) {
      return (
        <div className="w-full bg-red-500/5 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-red-500 mt-4 text-left">
          <div>
            <p className="font-bold capitalize">This order has been {status}.</p>
            {ord.cancellationReason && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Reason: "{ord.cancellationReason}"</p>
            )}
          </div>
          <span className="text-[10px] text-slate-400">Inventory levels restored & payments updated.</span>
        </div>
      );
    }

    const steps = ['placed', 'processing', 'shipped', 'delivered'];
    const currentIdx = steps.indexOf(status);

    return (
      <div className="w-full pt-4 mt-4 border-t border-slate-100 dark:border-primary-500/20">
        <div className="flex justify-between items-center relative text-[10px] font-bold text-slate-400">
          {/* Progress bar line */}
          <div className="absolute left-6 right-6 top-3 h-0.5 bg-slate-200 dark:bg-primary-600 -z-10 w-[calc(100%-48px)]">
            <div
              className="h-full bg-accent-blue transition-all duration-500"
              style={{ width: `${(Math.max(0, currentIdx) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>

          {steps.map((step, idx) => {
            const isActive = idx <= currentIdx;
            const isCompleted = idx < currentIdx;
            return (
              <div key={step} className="flex flex-col items-center gap-1.5 z-10 w-16">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all font-bold ${isCompleted
                    ? 'bg-accent-blue text-white'
                    : isActive
                      ? 'bg-white dark:bg-primary-700 border-2 border-accent-blue text-accent-blue scale-110 shadow-sm shadow-accent-blue/20'
                      : 'bg-slate-100 dark:bg-primary-600 text-slate-400 dark:text-slate-500'
                  }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`capitalize text-[9px] ${isActive ? 'text-accent-blue font-extrabold' : 'text-slate-400 font-medium'}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    const reason = window.prompt(`Please enter the mandatory reason for cancelling order ${orderNumber}:`);
    if (reason === null) return; // User cancelled prompt
    if (!reason.trim()) {
      toast.warning('Reason Required', 'You must enter a cancellation reason.');
      return;
    }

    setCancelLoading(orderId);
    try {
      await api.put(`/orders/${orderId}/cancel`, { cancellationReason: reason });
      toast.success('Order Cancelled', `Order ${orderNumber} has been cancelled successfully.`);

      // Update local state status to cancelled
      setOrders(prev => prev.map(ord =>
        (ord._id || ord.id) === orderId
          ? {
            ...ord,
            orderStatus: 'cancelled',
            paymentStatus: ord.paymentStatus === 'paid' ? 'refunded' : ord.paymentStatus,
            cancellationReason: reason
          }
          : ord
      ));
    } catch (err: any) {
      toast.error('Cancel Failed', err.message || 'Could not cancel the order.');
    } finally {
      setCancelLoading(null);
    }
  };

  const handleActivateLicense = async (licenseKey: string) => {
    const mac = macInputs[licenseKey]?.trim();
    if (!mac) {
      toast.warning('Input Required', 'Please enter a valid MAC address.');
      return;
    }

    // Basic MAC Address format validation
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(mac)) {
      toast.warning('Invalid MAC', 'Format must be e.g. 00:1A:2B:3C:4D:5E');
      return;
    }

    setLicenseActionLoading(licenseKey);
    try {
      const res = await api.post('/licenses/activate', { licenseKey, macAddress: mac });
      toast.success('Device Bound!', 'License key activated on device successfully.');

      // Update local state list
      setLicenses(prev => prev.map(lic =>
        lic.licenseKey === licenseKey
          ? {
            ...lic,
            activeActivations: res.data?.data?.activeActivations || (lic.activeActivations + 1),
            macAddresses: [...(lic.macAddresses || []), mac]
          }
          : lic
      ));

      // Clear input
      setMacInputs(prev => ({ ...prev, [licenseKey]: '' }));
    } catch (err: any) {
      toast.error('Activation Failed', err.response?.data?.message || err.message || 'Could not bind MAC address.');
    } finally {
      setLicenseActionLoading(null);
    }
  };

  const handleDeactivateMac = async (licenseId: string, licenseKey: string, mac: string) => {
    if (!window.confirm(`Are you sure you want to release MAC address ${mac} from this license?`)) return;

    setLicenseActionLoading(licenseKey);
    try {
      await api.put(`/licenses/${licenseId}/deactivate-mac`, { macAddress: mac });
      toast.success('Device Released!', `MAC address ${mac} has been released.`);

      // Update local state list
      setLicenses(prev => prev.map(lic =>
        (lic._id || lic.id) === licenseId
          ? {
            ...lic,
            activeActivations: Math.max(0, lic.activeActivations - 1),
            macAddresses: lic.macAddresses.filter((m: string) => m !== mac)
          }
          : lic
      ));
    } catch (err: any) {
      toast.error('Release Failed', err.response?.data?.message || err.message || 'Could not release MAC address.');
    } finally {
      setLicenseActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">

      {/* Profile Overview */}
      <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-white to-slate-50 dark:from-primary-700 dark:to-primary-600 rounded-3xl shadow-xl border border-slate-200/60 dark:border-primary-500/30">
        <div className="flex items-center gap-5 text-left w-full sm:w-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-accent-blue via-indigo-600 to-accent-blue text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-accent-blue/30 shrink-0 border-2 border-white/40">
            {user?.name?.charAt(0).toUpperCase() || <UserIcon size={32} />}
          </div>
          <div className="space-y-1.5">
            <h2 className="font-black text-2xl sm:text-3xl text-primary-500 dark:text-primary-50 tracking-tight">{user?.name}</h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-300 font-semibold flex flex-wrap items-center gap-2">
              <span>{user?.email}</span>
              {(user as any)?.phone && <span>| {(user as any).phone}</span>}
              <span>&nbsp;|&nbsp; Role:</span>
              <span className="font-black text-accent-blue uppercase bg-accent-blue/10 dark:bg-accent-blue/20 px-3 py-0.5 rounded-full text-xs sm:text-sm border border-accent-blue/20">
                {user?.role}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto shrink-0 justify-end">
          {user?.role === 'admin' && <button onClick={() => navigate('/admin')} className="btn-primary py-3 px-6 text-sm font-extrabold rounded-2xl shadow-lg shadow-accent-blue/20">Admin Panel</button>}
          {user?.role === 'employee' && <button onClick={() => navigate('/employee')} className="btn-secondary py-3 px-6 text-sm font-extrabold rounded-2xl shadow-md">Staff Panel</button>}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-primary-500 gap-8 overflow-x-auto pb-1">
        <button
          onClick={() => { setActiveTab('orders'); setSelectedTicket(null); }}
          className={`pb-3.5 font-extrabold text-sm sm:text-base flex items-center gap-2.5 transition-colors focus:outline-none shrink-0 ${activeTab === 'orders' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-slate-400 hover:text-primary-500'}`}
        >
          <ShoppingBag size={18} /> My Orders
        </button>
        <button
          onClick={() => { setActiveTab('licenses'); setSelectedTicket(null); }}
          className={`pb-3.5 font-extrabold text-sm sm:text-base flex items-center gap-2.5 transition-colors focus:outline-none shrink-0 ${activeTab === 'licenses' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-slate-400 hover:text-primary-500'}`}
        >
          <KeyRound size={18} /> Software Licenses
        </button>
        <button
          onClick={() => { setActiveTab('tickets'); }}
          className={`pb-3.5 font-extrabold text-sm sm:text-base flex items-center gap-2.5 transition-colors focus:outline-none shrink-0 ${activeTab === 'tickets' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-slate-400 hover:text-primary-500'}`}
        >
          <LifeBuoy size={18} /> Support Helpdesk
        </button>
        <button
          onClick={() => { setActiveTab('notifications'); setSelectedTicket(null); }}
          className={`pb-3.5 font-extrabold text-sm sm:text-base flex items-center gap-2.5 transition-colors focus:outline-none shrink-0 ${activeTab === 'notifications' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-slate-400 hover:text-primary-500'}`}
        >
          <div className="relative">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                {unreadCount}
              </span>
            )}
          </div>
          Notifications History
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-96">

        {/* Panel 1: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {dataLoading ? (
              <div className="flex items-center gap-3 py-8">
                <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">Loading your orders...</p>
              </div>
            ) : ordersError ? (
              <div className="glass-card p-6 border border-red-500/20 bg-red-500/5 text-center space-y-2">
                <AlertTriangle size={24} className="text-red-400 mx-auto" />
                <p className="text-xs text-red-400 font-semibold">Could not load orders</p>
                <p className="text-[10px] text-slate-400">{ordersError}</p>
                <p className="text-[10px] text-slate-400">Please try logging out and back in.</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-card p-8 text-center space-y-3">
                <ShoppingBag size={32} className="text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-400">No orders yet</p>
                <p className="text-xs text-slate-400">Your confirmed orders will appear here after checkout.</p>
              </div>
            ) : (
              orders.map((ord) => (
                <div key={ord.orderNumber} className="glass-card p-6 sm:p-7 flex flex-col gap-5 text-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-base sm:text-lg text-primary-500 dark:text-primary-50">{ord.orderNumber}</span>
                        {getStatusBadge(ord.orderStatus)}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400">Placed on: {new Date(ord.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm sm:text-base font-bold text-accent-blue">Total Invoice Amount: INR {ord.grandTotal?.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-400">Invoice: <span className="font-bold text-slate-700 dark:text-slate-200">{ord.invoiceNumber}</span> &nbsp;|&nbsp; Payment: <span className="capitalize font-bold text-slate-700 dark:text-slate-200">{ord.paymentStatus}</span></p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0">
                      {['placed', 'processing'].includes(ord.orderStatus) && (
                        <button
                          onClick={() => handleCancelOrder(ord._id || ord.id, ord.orderNumber)}
                          disabled={cancelLoading === (ord._id || ord.id)}
                          className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5"
                        >
                          {cancelLoading === (ord._id || ord.id) ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                      <button
                        onClick={() => downloadMockInvoice(ord.orderNumber)}
                        className="btn-secondary py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5"
                      >
                        <Download size={14} /> Invoice PDF
                      </button>
                    </div>
                  </div>
                  {renderStatusStepper(ord)}
                </div>
              ))
            )}
          </div>
        )}

        {/* Panel 2: Licenses */}
        {activeTab === 'licenses' && (
          <div className="space-y-4">
            {licenses.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No active software licenses found.</p>
            ) : (
              licenses.map((lic) => (
                <div key={lic.licenseKey} className="glass-card p-6 sm:p-7 flex flex-col gap-6 text-sm">
                  {/* Top Header Row */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-base sm:text-lg bg-slate-100 dark:bg-primary-600 px-3 py-1 rounded-xl text-accent-blue select-all">{lic.licenseKey}</span>
                        {getStatusBadge(lic.status)}
                      </div>
                      <p className="font-black text-base sm:text-xl text-primary-500 dark:text-primary-50">{lic.productName}</p>
                      <p className="text-xs sm:text-sm text-slate-400">Expires: <span className="font-semibold text-slate-700 dark:text-slate-200">{new Date(lic.validUntil).toLocaleDateString()}</span></p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
                      <Link to="/billing-software" className="btn-secondary py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold">
                        Download SDK / Package
                      </Link>
                    </div>
                  </div>

                  {/* Active Registrations / Binding Console */}
                  <div className="pt-4 border-t border-slate-100 dark:border-primary-500/20 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-left">
                    {/* Left: Active MAC List */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs sm:text-sm text-slate-400 uppercase tracking-wider">Active Device Bindings</span>
                        <span className="text-xs font-extrabold text-accent-blue">
                          {lic.activeActivations} / {lic.maxActivations} Devices Active
                        </span>
                      </div>
                      {(!lic.macAddresses || lic.macAddresses.length === 0) ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-primary-600/20 p-3.5 rounded-2xl">
                          No MAC addresses bound to this license key. Use the console to register a device.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {lic.macAddresses.map((mac: string) => (
                            <div key={mac} className="flex justify-between items-center bg-slate-50 dark:bg-primary-600/30 p-3 rounded-2xl border border-slate-100 dark:border-primary-500/10">
                              <span className="font-mono text-xs sm:text-sm font-extrabold text-primary-500 dark:text-primary-100">{mac}</span>
                              <button
                                onClick={() => handleDeactivateMac(lic._id || lic.id, lic.licenseKey, mac)}
                                disabled={licenseActionLoading === lic.licenseKey}
                                className="text-red-500 hover:text-red-600 font-bold text-xs uppercase hover:underline"
                                title="Deactivate and release device"
                              >
                                Release Device
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Bind New MAC Form */}
                    <div className="space-y-3">
                      <span className="font-bold text-xs sm:text-sm text-slate-400 uppercase tracking-wider block">Bind Office Server / Device MAC</span>
                      {lic.activeActivations >= lic.maxActivations ? (
                        <p className="text-xs text-orange-500 bg-orange-500/5 border border-orange-500/10 p-3.5 rounded-2xl font-semibold">
                          Activation limit reached. Please release an existing MAC address before binding a new device.
                        </p>
                      ) : lic.status !== 'active' ? (
                        <p className="text-xs text-red-500 bg-red-500/5 border border-red-500/10 p-3.5 rounded-2xl font-semibold">
                          Cannot bind new devices. This license status is currently: <span className="uppercase font-bold">{lic.status}</span>.
                        </p>
                      ) : (
                        <div className="space-y-3 bg-slate-50 dark:bg-primary-600/15 p-4 rounded-2xl border border-slate-100 dark:border-primary-500/5">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">Office Server MAC Address</label>
                            <input
                              type="text"
                              placeholder="e.g. 00:1A:2B:3C:4D:5E"
                              value={macInputs[lic.licenseKey] || ''}
                              onChange={(e) => setMacInputs(prev => ({ ...prev, [lic.licenseKey]: e.target.value }))}
                              className="input-field py-2 text-xs sm:text-sm font-mono"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleActivateLicense(lic.licenseKey)}
                            disabled={licenseActionLoading === lic.licenseKey}
                            className="btn-primary w-full py-2.5 text-xs sm:text-sm font-bold animate-pulse-glow rounded-xl"
                          >
                            {licenseActionLoading === lic.licenseKey ? 'Binding...' : 'Bind & Activate Device'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Panel 3: Tickets */}
        {activeTab === 'tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* List and Form */}
            <div className="lg:col-span-1 space-y-6">
              {/* Form */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5"><Plus size={16} className="text-accent-blue" /> Submit New Support Ticket</h3>
                {ticketSubmitSuccess && <p className="p-3 bg-green-500/10 text-green-500 rounded-xl text-xs font-bold text-center">Ticket created successfully!</p>}

                <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-500 dark:text-slate-300">Subject / Title</span>
                    <input
                      type="text"
                      required
                      placeholder="Summary of issue"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      className="input-field py-2 text-xs sm:text-sm rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-500 dark:text-slate-300">Category</span>
                      <select
                        value={newTicketCategory}
                        onChange={(e) => setNewTicketCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-xl text-xs sm:text-sm outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                      >
                        <option value="general">General</option>
                        <option value="technical">Technical</option>
                        <option value="billing">Billing</option>
                        <option value="sales">Sales</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-500 dark:text-slate-300">Priority</span>
                      <select
                        value={newTicketPriority}
                        onChange={(e) => setNewTicketPriority(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-xl text-xs sm:text-sm outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-500 dark:text-slate-300">Description</span>
                    <textarea
                      required
                      placeholder="Provide full installation, scanner model, or key details..."
                      value={newTicketDesc}
                      onChange={(e) => setNewTicketDesc(e.target.value)}
                      rows={3}
                      className="input-field py-2 text-xs sm:text-sm resize-none rounded-xl"
                    />
                  </div>
                  <button type="submit" className="w-full btn-primary py-2.5 text-xs sm:text-sm font-bold rounded-xl shadow-md">
                    Create Ticket
                  </button>
                </form>
              </div>

              {/* Tickets list */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs sm:text-sm text-slate-400 uppercase tracking-wider">Open Support Tickets</h3>
                {tickets.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No tickets found.</p>
                ) : (
                  tickets.map((tck) => (
                    <div
                      key={tck.ticketNumber}
                      onClick={() => { setSelectedTicket(tck); setIsChatPopupOpen(true); }}
                      className={`p-4 border rounded-2xl cursor-pointer transition-all text-left space-y-2.5 hover:bg-slate-100/30 ${selectedTicket?.ticketNumber === tck.ticketNumber ? 'border-accent-blue bg-accent-blue/5' : 'border-slate-200/50 dark:border-primary-500/20'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs sm:text-sm text-accent-blue">{tck.ticketNumber}</span>
                        {getStatusBadge(tck.status)}
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm truncate leading-tight">{tck.subject}</h4>
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-100 dark:border-primary-500/10">
                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Updated: {new Date(tck.updatedAt).toLocaleDateString()}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(tck);
                            setIsChatPopupOpen(true);
                          }}
                          className="text-xs font-bold text-white bg-accent-blue hover:bg-accent-blue/90 px-3 py-1 rounded-xl transition-all shadow-sm"
                        >
                          Chat Support
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Conversation Thread */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <div className="glass-card p-6 flex flex-col justify-between h-[500px]">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-primary-500 pb-3">
                      <div>
                        <span className="font-mono text-xs text-slate-400">Ticket Ref: {selectedTicket.ticketNumber}</span>
                        <h3 className="font-bold text-sm text-primary-500 dark:text-primary-50">{selectedTicket.subject}</h3>
                      </div>
                      {getStatusBadge(selectedTicket.status)}
                    </div>

                    {/* Messages Body */}
                    <div className="mt-4 space-y-4 overflow-y-auto max-h-[300px] pr-2 text-xs">
                      {selectedTicket.messages.map((msg: any, i: number) => {
                        const isSelf = msg.sender?.name === 'You' || msg.sender?.name === user?.name;
                        return (
                          <div key={i} className={`flex flex-col space-y-1 ${isSelf ? 'items-end' : 'items-start'}`}>
                            <span className="text-[9px] text-slate-400">{msg.sender?.name || 'Staff Support'}</span>
                            <div className={`p-3 rounded-2xl max-w-sm leading-relaxed ${isSelf ? 'bg-accent-blue text-white rounded-tr-none' : 'bg-slate-100 dark:bg-primary-600 rounded-tl-none'}`}>
                              {msg.message}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reply Input */}
                  <form onSubmit={handleSendTicketMessage} className="mt-4 border-t border-slate-100 dark:border-primary-500 pt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Write your response message..."
                      required
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="input-field text-xs py-2"
                    />
                    <button type="submit" className="btn-primary py-2 px-4 text-xs font-semibold rounded-xl">
                      <Send size={14} /> Send
                    </button>
                  </form>

                </div>
              ) : (
                <div className="glass-card p-6 flex flex-col items-center justify-center text-center h-[500px]">
                  <LifeBuoy size={36} className="text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">Select an open support ticket to view details and response threads.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Panel 4: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-primary-500/20">
              <h3 className="font-extrabold text-sm text-primary-500 dark:text-primary-50">Notifications History</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="text-xs text-accent-blue font-bold hover:underline flex items-center gap-1 bg-transparent border-none outline-none cursor-pointer"
                >
                  <CheckCheck size={12} /> Mark All as Read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="glass-card p-8 text-center space-y-3">
                <Bell size={32} className="text-slate-300 mx-auto opacity-35" />
                <p className="text-sm font-bold text-slate-400">No notifications yet</p>
                <p className="text-xs text-slate-400">Important status updates on your orders and support tickets will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif._id || notif.id}
                    onClick={() => handleMarkOneNotificationRead(notif._id || notif.id, notif.linkUrl)}
                    className={`glass-card p-4 flex items-start gap-4 transition-all cursor-pointer text-left ${!notif.isRead ? 'bg-accent-blue/5 border-l-4 border-l-accent-blue' : 'hover:bg-slate-50 dark:hover:bg-primary-600/20'}`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-primary-600 text-accent-blue">
                      <Bell size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className={`text-xs font-extrabold ${!notif.isRead ? 'text-primary-500 dark:text-primary-50' : 'text-slate-400'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[9px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-accent-blue shrink-0 self-center" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Floating Support Ticket Chat Popup Modal */}
        {isChatPopupOpen && selectedTicket && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-lg w-full p-0 flex flex-col h-[550px] animate-fade-in relative bg-white dark:bg-primary-700 rounded-3xl overflow-hidden border border-slate-100 dark:border-primary-500/20 shadow-2xl">

              {/* Chat Header */}
              <div className="bg-primary-500 text-white p-4 flex items-center justify-between dark:bg-primary-600">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-primary-200">Ref: {selectedTicket.ticketNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${selectedTicket.status === 'resolved'
                        ? 'bg-green-500/25 text-green-300'
                        : 'bg-yellow-500/25 text-yellow-300'
                      }`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs truncate max-w-[250px]">{selectedTicket.subject}</h3>
                </div>
                <button
                  onClick={() => setIsChatPopupOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-primary-800/30 text-xs">
                {/* Original ticket description message */}
                <div className="flex flex-col space-y-1 items-start">
                  <span className="text-[9px] text-slate-400 font-bold">You (Original Description)</span>
                  <div className="p-3 bg-slate-100 dark:bg-primary-600 rounded-2xl rounded-tl-none leading-relaxed text-left">
                    {selectedTicket.description}
                  </div>
                </div>

                {selectedTicket.messages && selectedTicket.messages.map((msg: any, i: number) => {
                  const isSelf = msg.sender?.name === 'You' || msg.sender?.name === user?.name;
                  return (
                    <div key={i} className={`flex flex-col space-y-1 ${isSelf ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-slate-400">
                        {isSelf ? 'You' : msg.sender?.name || 'Technical Support'}
                      </span>
                      <div className={`p-3 rounded-2xl max-w-[280px] leading-relaxed text-left ${isSelf ? 'bg-accent-blue text-white rounded-tr-none' : 'bg-slate-200/60 dark:bg-primary-600 rounded-tl-none text-primary-500 dark:text-primary-50'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Footer Reply Input */}
              <form onSubmit={handleSendTicketMessage} className="p-3 border-t border-slate-100 dark:border-primary-500/30 bg-white dark:bg-primary-700 flex gap-2">
                <input
                  type="text"
                  placeholder={selectedTicket.status === 'resolved' ? "Ticket is resolved (Read Only)" : "Type your message..."}
                  required
                  disabled={selectedTicket.status === 'resolved'}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="input-field text-xs py-2 px-3 rounded-xl flex-1 bg-slate-50 dark:bg-primary-600 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={selectedTicket.status === 'resolved'}
                  className="btn-primary py-2 px-4 text-xs font-bold rounded-xl shrink-0 disabled:opacity-50"
                >
                  <Send size={14} /> Send
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
