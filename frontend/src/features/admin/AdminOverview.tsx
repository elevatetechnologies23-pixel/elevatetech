import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  IndianRupee, 
  ShoppingBag, 
  Users, 
  Layers,
  TrendingUp,
  Clock
} from 'lucide-react';

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<any>({
    totalRevenue: 382400,
    totalOrders: 28,
    totalCustomers: 142,
    totalProducts: 45,
    recentOrders: [],
    salesGraph: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        if (res.data?.data) {
          setStats(res.data.data);
        }
      } catch {
        console.warn('API error, using offline stats mocks');
        setStats({
          totalRevenue: 382400,
          totalOrders: 28,
          totalCustomers: 142,
          totalProducts: 45,
          recentOrders: [
            { orderNumber: 'ORD-582910', user: { name: 'Rahul Sen', email: 'rahul@gmail.com' }, grandTotal: 153400, orderStatus: 'shipped', createdAt: new Date().toISOString() },
            { orderNumber: 'ORD-920184', user: { name: 'Preeti Deshmukh', email: 'preeti@gmail.com' }, grandTotal: 14160, orderStatus: 'delivered', createdAt: new Date().toISOString() },
            { orderNumber: 'ORD-103940', user: { name: 'K-Retail Labs', email: 'procure@kretail.com' }, grandTotal: 12000, orderStatus: 'placed', createdAt: new Date().toISOString() }
          ],
          salesGraph: [
            { date: 'Mon', revenue: 45000 },
            { date: 'Tue', revenue: 78000 },
            { date: 'Wed', revenue: 32000 },
            { date: 'Thu', revenue: 95000 },
            { date: 'Fri', revenue: 110000 },
            { date: 'Sat', revenue: 125000 },
            { date: 'Sun', revenue: 85000 }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Find max sales value to scale bar charts
  const maxRevenue = Math.max(...stats.salesGraph.map((s: any) => s.revenue || 1));

  return (
    <div className="space-y-8">
      {/* 4 Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Revenue */}
        <div className="glass-card p-6 flex justify-between items-center">
          <div className="space-y-1.5 text-left text-xs">
            <span className="text-slate-400 font-semibold block">Total Revenue</span>
            <span className="text-xl font-extrabold text-primary-500 dark:text-primary-50">
              INR {stats.totalRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center shadow-inner">
            <IndianRupee size={20} />
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="glass-card p-6 flex justify-between items-center">
          <div className="space-y-1.5 text-left text-xs">
            <span className="text-slate-400 font-semibold block">Total Orders</span>
            <span className="text-xl font-extrabold text-primary-500 dark:text-primary-50">{stats.totalOrders}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-accent-blue/10 text-accent-blue flex items-center justify-center shadow-inner">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Card 3: Customers */}
        <div className="glass-card p-6 flex justify-between items-center">
          <div className="space-y-1.5 text-left text-xs">
            <span className="text-slate-400 font-semibold block">Active Clients</span>
            <span className="text-xl font-extrabold text-primary-500 dark:text-primary-50">{stats.totalCustomers}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-inner">
            <Users size={20} />
          </div>
        </div>

        {/* Card 4: Products */}
        <div className="glass-card p-6 flex justify-between items-center">
          <div className="space-y-1.5 text-left text-xs">
            <span className="text-slate-400 font-semibold block">Active Catalog</span>
            <span className="text-xl font-extrabold text-primary-500 dark:text-primary-50">{stats.totalProducts}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-inner">
            <Layers size={20} />
          </div>
        </div>

      </div>

      {/* Analytics Graph & Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales trend bar chart */}
        <div className="lg:col-span-2 glass-card p-6 space-y-6">
          <h3 className="font-bold text-sm flex items-center gap-1.5 border-b border-slate-100 dark:border-primary-500 pb-2">
            <TrendingUp size={16} className="text-accent-blue" /> Weekly Revenue Analytics
          </h3>

          <div className="flex items-end justify-between h-48 pt-4 px-4">
            {stats.salesGraph.map((day: any, i: number) => {
              const heightPct = Math.round((day.revenue / maxRevenue) * 100);
              return (
                <div key={i} className="flex flex-col items-center gap-2 group w-1/8">
                  <div className="relative w-8 bg-accent-blue/15 hover:bg-accent-blue dark:bg-primary-600 dark:hover:bg-accent-blue rounded-t-lg transition-colors flex items-end justify-center" style={{ height: `${Math.max(5, heightPct)}%` }}>
                    <span className="absolute -top-6 bg-slate-800 text-white text-[9px] rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow z-10">
                      INR {day.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders Queue */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-1.5 border-b border-slate-100 dark:border-primary-500 pb-2">
            <Clock size={16} className="text-accent-blue" /> Recent Orders Queue
          </h3>
          
          <div className="space-y-4">
            {stats.recentOrders.map((ord: any) => (
              <div key={ord.orderNumber} className="flex justify-between items-center text-xs">
                <div className="text-left space-y-0.5">
                  <span className="font-bold text-accent-blue block">{ord.orderNumber}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{ord.user?.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold block">INR {ord.grandTotal.toLocaleString('en-IN')}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">{ord.orderStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminOverview;
