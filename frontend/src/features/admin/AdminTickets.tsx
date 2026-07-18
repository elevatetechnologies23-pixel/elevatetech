import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import api from '../../services/api';
import { RefreshCw, X, Send, MessageSquare } from 'lucide-react';
import { useToast } from '../../utils/ToastContext';

const AdminTickets: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Active chat popup states
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/tickets/admin-list');
      if (res.data?.data) {
        setTickets(res.data.data);
      }
    } catch {
      console.warn('API error, using offline tickets');
      setTickets([
        { id: '1', ticketNumber: 'TCK-294021', subject: 'Printer alignment issue offline', category: 'technical', priority: 'medium', status: 'open', user: { name: 'Rahul Sen', email: 'rahul@gmail.com' }, description: 'The printer displays an alignment error code and fails calibration after multiple cleaning runs.', messages: [], updatedAt: new Date().toISOString() },
        { id: '2', ticketNumber: 'TCK-850123', subject: 'Refund query for order', category: 'billing', priority: 'high', status: 'in-progress', user: { name: 'Preeti Deshmukh', email: 'preeti@gmail.com' }, description: 'Requesting status update on order cancellation refund process.', messages: [], updatedAt: new Date().toISOString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadTickets = async () => {
    try {
      const res = await api.get('/tickets/admin-list');
      if (res.data?.data) {
        const updatedList = res.data.data;
        setTickets(updatedList);
        // If chat popup is open, update selectedTicket details in real-time
        if (selectedTicket) {
          const freshTicket = updatedList.find((t: any) => t.ticketNumber === selectedTicket.ticketNumber);
          if (freshTicket) {
            const detailsRes = await api.get(`/tickets/details/${selectedTicket.ticketNumber}`);
            if (detailsRes.data?.data) {
              setSelectedTicket(detailsRes.data.data);
            } else {
              setSelectedTicket(freshTicket);
            }
          }
        }
      }
    } catch {
      console.warn('API error reloading tickets');
    }
  };

  useEffect(() => {
    loadTickets();

    const handleRealtimeUpdate = () => {
      reloadTickets();
    };

    window.addEventListener('realtime-ticket-update', handleRealtimeUpdate);
    return () => window.removeEventListener('realtime-ticket-update', handleRealtimeUpdate);
  }, [selectedTicket]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/tickets/${id}/status`, { status: newStatus });
      toast.success('Status Updated', `Ticket status set to ${newStatus}.`);
      loadTickets();
    } catch {
      setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
    }
  };

  const handleOpenChat = async (ticket: any) => {
    setSelectedTicket(ticket);
    setIsChatPopupOpen(true);
    try {
      const res = await api.get(`/tickets/details/${ticket.ticketNumber}`);
      if (res.data?.data) {
        setSelectedTicket(res.data.data);
      }
    } catch {
      console.warn('API error fetching ticket details, using offline state');
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
        toast.success('Message Sent', 'Reply sent to customer.');
        loadTickets();
      }
    } catch {
      // Offline fallback
      const updatedMessages = [...(selectedTicket.messages || []), { sender: { name: 'You (Staff)' }, message: chatMessage, createdAt: new Date().toISOString() }];
      const updatedTicket = { ...selectedTicket, messages: updatedMessages, status: 'in-progress' };
      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => t.ticketNumber === selectedTicket.ticketNumber ? updatedTicket : t));
      setChatMessage('');
      toast.success('Offline Reply Saved', 'Saved locally.');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'open') {
      return <span className="bg-blue-500/10 text-accent-blue px-2 py-0.5 rounded text-[10px] font-bold capitalize">{status}</span>;
    }
    if (status === 'resolved') {
      return <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] font-bold capitalize">{status}</span>;
    }
    return <span className="bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded text-[10px] font-bold capitalize">{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-primary-500 pb-4">
        <div>
          <h2 className="text-xl font-bold">Support Tickets Queue</h2>
          <p className="text-xs text-slate-400">Respond to customer helpdesk tickets and configure troubleshooting parameters</p>
        </div>
        <button onClick={loadTickets} className="btn-secondary text-xs font-semibold py-1.5 px-3 rounded-lg border flex items-center gap-1.5">
          <RefreshCw size={14} /> Refresh Helpdesk
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-primary-500 bg-slate-50 dark:bg-primary-700/50">
                <th className="px-6 py-4 font-bold text-slate-400">Ticket Number</th>
                <th className="px-6 py-4 font-bold text-slate-400">Customer</th>
                <th className="px-6 py-4 font-bold text-slate-400">Subject</th>
                <th className="px-6 py-4 font-bold text-slate-400">Category / Priority</th>
                <th className="px-6 py-4 font-bold text-slate-400">Status</th>
                <th className="px-6 py-4 font-bold text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((tck) => (
                <tr key={tck.ticketNumber} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                  <td className="px-6 py-4 font-bold text-accent-blue">
                    <span>{tck.ticketNumber}</span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    <span className="font-semibold block">{tck.user?.name || 'Local Customer'}</span>
                    <span className="text-[10px] text-slate-400 block">{tck.user?.email}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold truncate max-w-xs">{tck.subject}</td>
                  <td className="px-6 py-4 capitalize">
                    <span>{tck.category}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{tck.priority} priority</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(tck.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenChat(tck)}
                        className="bg-accent-blue/10 text-accent-blue hover:bg-accent-blue hover:text-white py-1 px-2.5 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all"
                      >
                        <MessageSquare size={12} /> Respond
                      </button>
                      <select 
                        value={tck.status} 
                        disabled={user?.role !== 'admin'}
                        onChange={(e) => handleUpdateStatus(tck._id || tck.id || tck.ticketNumber, e.target.value)}
                        className={`px-2 py-1 bg-slate-50 dark:bg-primary-600 rounded text-[10px] outline-none border border-slate-200 dark:border-primary-500/20 font-semibold ${user?.role !== 'admin' ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    selectedTicket.status === 'resolved' 
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
                <span className="text-[9px] text-slate-400 font-bold">{selectedTicket.user?.name || 'Customer'} (Original Description)</span>
                <div className="p-3 bg-slate-200/60 dark:bg-primary-600 rounded-2xl rounded-tl-none leading-relaxed text-left">
                  {selectedTicket.description}
                </div>
              </div>

              {selectedTicket.messages && selectedTicket.messages.map((msg: any, i: number) => {
                // Senders logic inside admin panel
                const isSelf = msg.sender?.role === 'admin' || msg.sender?.role === 'employee' || msg.sender?.name === 'You (Staff)';
                return (
                  <div key={i} className={`flex flex-col space-y-1 ${isSelf ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {isSelf ? 'You (Staff)' : msg.sender?.name || selectedTicket.user?.name || 'Customer'}
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
                placeholder="Type your reply message..."
                required
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="input-field text-xs py-2 px-3 rounded-xl flex-1 bg-slate-50 dark:bg-primary-600"
              />
              <button 
                type="submit" 
                className="btn-primary py-2 px-4 text-xs font-bold rounded-xl shrink-0"
              >
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminTickets;
