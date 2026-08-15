import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, CheckCircle, AlertTriangle, CreditCard, Trash2 } from 'lucide-react';
import { useToast } from '../../utils/ToastContext';

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'partially_paid'];
const ORDER_STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingPayId, setUpdatingPayId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/orders/admin-queue');
      if (res.data?.data) {
        setOrders(res.data.data);
      }
    } catch (err: any) {
      console.warn('API error loading orders:', err.message);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadOrders = async () => {
    try {
      const res = await api.get('/orders/admin-queue');
      if (res.data?.data) {
        setOrders(res.data.data);
      }
    } catch (err: any) {
      console.warn('API error reloading orders:', err.message);
    }
  };

  useEffect(() => {
    loadOrders();

    const handleRealtimeUpdate = () => {
      reloadOrders();
    };

    window.addEventListener('realtime-order-update', handleRealtimeUpdate);
    return () => window.removeEventListener('realtime-order-update', handleRealtimeUpdate);
  }, []);

  // ─── Update Order Status ──────────────────────────────────────────────────
  const handleUpdateStatus = async (ord: any, newStatus: string) => {
    const mongoId = ord._id || ord.id;
    if (!mongoId) {
      setUpdateMsg({ type: 'error', text: 'Cannot update: order ID not found.' });
      return;
    }

    let reason = '';
    if (newStatus === 'cancelled') {
      const input = window.prompt(`Please enter the mandatory reason for cancelling order ${ord.orderNumber}:`);
      if (input === null) return;
      if (!input.trim()) {
        toast.warning('Reason Required', 'You must enter a cancellation reason.');
        return;
      }
      reason = input.trim();
    }

    setUpdatingId(mongoId);
    setUpdateMsg(null);

    try {
      await api.put(`/orders/${mongoId}/status`, { status: newStatus, cancellationReason: reason });
      setOrders(prev =>
        prev.map(o => (o._id || o.id) === mongoId ? { ...o, orderStatus: newStatus, cancellationReason: reason } : o)
      );
      setUpdateMsg({ type: 'success', text: `Order ${ord.orderNumber} status → "${newStatus}"` });
      toast.success('Status Updated', `Order ${ord.orderNumber} → ${newStatus}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update order status.';
      setUpdateMsg({ type: 'error', text: msg });
      toast.error('Update Failed', msg);
    } finally {
      setUpdatingId(null);
      setTimeout(() => setUpdateMsg(null), 3000);
    }
  };

  // ─── Update Payment Status ────────────────────────────────────────────────
  const handleUpdatePaymentStatus = async (ord: any, newPaymentStatus: string) => {
    const mongoId = ord._id || ord.id;
    if (!mongoId) return;

    setUpdatingPayId(mongoId);
    setUpdateMsg(null);

    try {
      await api.put(`/orders/${mongoId}/payment-status`, { paymentStatus: newPaymentStatus });
      setOrders(prev =>
        prev.map(o => (o._id || o.id) === mongoId ? { ...o, paymentStatus: newPaymentStatus } : o)
      );
      setUpdateMsg({ type: 'success', text: `Order ${ord.orderNumber} payment → "${newPaymentStatus}"` });
      toast.success('Payment Status Updated', `Order ${ord.orderNumber} payment marked as ${newPaymentStatus}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update payment status.';
      setUpdateMsg({ type: 'error', text: msg });
      toast.error('Update Failed', msg);
    } finally {
      setUpdatingPayId(null);
      setTimeout(() => setUpdateMsg(null), 3000);
    }
  };

  // ─── Delete Order ─────────────────────────────────────────────────────────
  const handleDeleteOrder = async (ord: any) => {
    const mongoId = ord._id || ord.id;
    if (!mongoId) return;

    const confirmed = window.confirm(
      `⚠️ Permanently delete order ${ord.orderNumber}?\n\nThis action CANNOT be undone. The order record will be removed from the database.`
    );
    if (!confirmed) return;

    setDeletingId(mongoId);
    try {
      await api.delete(`/orders/${mongoId}`);
      setOrders(prev => prev.filter(o => (o._id || o.id) !== mongoId));
      toast.success('Order Deleted', `Order ${ord.orderNumber} has been permanently deleted.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete order.';
      toast.error('Delete Failed', msg);
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Status Badge ─────────────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    if (['shipped', 'delivered', 'paid'].includes(status)) {
      return <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] font-bold capitalize">{status}</span>;
    }
    if (['placed', 'processing', 'pending', 'partially_paid'].includes(status)) {
      return <span className="bg-blue-500/10 text-accent-blue px-2 py-0.5 rounded text-[10px] font-bold capitalize">{status.replace('_', ' ')}</span>;
    }
    if (['failed', 'cancelled', 'refunded'].includes(status)) {
      return <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold capitalize">{status}</span>;
    }
    return <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold capitalize">{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-primary-500 pb-4">
        <h2 className="text-xl font-bold">Orders Management Queue</h2>
        <button onClick={loadOrders} className="btn-secondary text-xs font-semibold py-1.5 px-3 rounded-lg border flex items-center gap-1.5">
          <RefreshCw size={14} /> Refresh Queue
        </button>
      </div>

      {/* Status update feedback */}
      {updateMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
          updateMsg.type === 'success'
            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {updateMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {updateMsg.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <p className="text-sm font-semibold">No orders in the queue yet.</p>
          <p className="text-xs mt-1">Orders placed by customers will appear here.</p>
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-primary-500 bg-slate-50 dark:bg-primary-700/50">
                <th className="px-5 py-4 font-bold text-slate-400">Order</th>
                <th className="px-5 py-4 font-bold text-slate-400">Customer</th>
                <th className="px-5 py-4 font-bold text-slate-400">Amount (INR)</th>
                <th className="px-5 py-4 font-bold text-slate-400">Order Status</th>
                <th className="px-5 py-4 font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CreditCard size={12} className="text-accent-blue" /> Payment Status
                  </span>
                </th>
                <th className="px-5 py-4 font-bold text-slate-400 text-right">Change Status</th>
                <th className="px-5 py-4 font-bold text-slate-400 text-right">Change Payment</th>
                <th className="px-5 py-4 font-bold text-slate-400 text-center">Delete</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => {
                const mongoId = ord._id || ord.id;
                const isUpdating = updatingId === mongoId;
                const isUpdatingPay = updatingPayId === mongoId;
                return (
                  <tr key={ord.orderNumber} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                    
                    {/* Order number + date */}
                    <td className="px-5 py-4">
                      <span className="font-bold text-accent-blue">{ord.orderNumber}</span>
                      <span className="text-[9px] text-slate-400 block font-normal mt-0.5">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4">
                      <span className="font-semibold block">{ord.user?.name || 'Customer'}</span>
                      <span className="text-[10px] text-slate-400 block">{ord.user?.email}</span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4 font-bold">
                      ₹{ord.grandTotal?.toLocaleString('en-IN')}
                    </td>

                    {/* Order Status badge */}
                    <td className="px-5 py-4">
                      {getStatusBadge(ord.orderStatus)}
                      {ord.orderStatus === 'cancelled' && ord.cancellationReason && (
                        <span className="text-[9px] text-red-500 block mt-1 leading-tight font-medium max-w-[120px] break-words">
                          Reason: "{ord.cancellationReason}"
                        </span>
                      )}
                    </td>

                    {/* Payment Status badge */}
                    <td className="px-5 py-4">
                      {getStatusBadge(ord.paymentStatus)}
                    </td>

                    {/* Order Status dropdown */}
                    <td className="px-5 py-4 text-right">
                      <select
                        value={ord.orderStatus}
                        disabled={isUpdating}
                        onChange={(e) => handleUpdateStatus(ord, e.target.value)}
                        className={`px-2 py-1.5 bg-slate-50 dark:bg-primary-600 rounded-lg text-[10px] outline-none border border-slate-200 dark:border-primary-500 font-semibold cursor-pointer transition-opacity ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {ORDER_STATUSES.map(s => (
                          <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>

                    {/* Payment Status dropdown */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <CreditCard size={11} className="text-slate-400" />
                        <select
                          value={ord.paymentStatus}
                          disabled={isUpdatingPay}
                          onChange={(e) => handleUpdatePaymentStatus(ord, e.target.value)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] outline-none border font-semibold cursor-pointer transition-all ${
                            isUpdatingPay ? 'opacity-50 cursor-wait' : ''
                          } ${
                            ord.paymentStatus === 'paid'
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-600'
                              : ord.paymentStatus === 'refunded'
                              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 text-purple-600'
                              : ord.paymentStatus === 'failed'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-500'
                              : 'bg-slate-50 dark:bg-primary-600 border-slate-200 dark:border-primary-500 text-slate-600 dark:text-slate-200'
                          }`}
                        >
                          {PAYMENT_STATUSES.map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                          ))}
                        </select>
                        {isUpdatingPay && (
                          <div className="w-3 h-3 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </td>

                    {/* Delete button */}
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleDeleteOrder(ord)}
                        disabled={deletingId === mongoId}
                        title="Permanently delete this order"
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all ${
                          deletingId === mongoId
                            ? 'opacity-40 cursor-wait border-slate-200 dark:border-primary-500'
                            : 'border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 hover:scale-110'
                        }`}
                      >
                        {deletingId === mongoId
                          ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={12} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
