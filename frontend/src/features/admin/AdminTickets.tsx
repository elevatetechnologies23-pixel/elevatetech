import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, X, Send, MessageSquare, Plus, Search, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '../../utils/ToastContext';

interface TicketItem {
  _id?: string;
  id?: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'sales' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  user?: { _id?: string; name?: string; email?: string } | any;
  assignedTo?: { _id?: string; name?: string; email?: string } | any;
  messages?: Array<{ sender?: any; message: string; createdAt: string }>;
  updatedAt?: string;
}

const AdminTickets: React.FC = () => {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  const toast = useToast();

  // Active chat popup states
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);

  // Create Ticket Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<'technical' | 'billing' | 'sales' | 'general'>('technical');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [userEmail, setUserEmail] = useState('');

  // Edit Ticket Modal State
  const [editingTicket, setEditingTicket] = useState<TicketItem | null>(null);
  const [editCategory, setEditCategory] = useState<'technical' | 'billing' | 'sales' | 'general'>('general');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [editStatus, setEditStatus] = useState<'open' | 'in-progress' | 'resolved' | 'closed'>('open');

  // Delete Ticket Modal State
  const [deletingTicket, setDeletingTicket] = useState<TicketItem | null>(null);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/tickets/admin-list');
      if (res.data?.data) {
        setTickets(res.data.data);
      }
    } catch {
      console.warn('API error, using offline tickets');
      if (tickets.length === 0) {
        setTickets([
          { _id: '1', ticketNumber: 'TCK-294021', subject: 'Printer alignment issue offline', category: 'technical', priority: 'medium', status: 'open', user: { name: 'Rahul Sen', email: 'rahul@gmail.com' }, description: 'The printer displays an alignment error code and fails calibration after multiple cleaning runs.', messages: [], updatedAt: new Date().toISOString() },
          { _id: '2', ticketNumber: 'TCK-850123', subject: 'Refund query for order', category: 'billing', priority: 'high', status: 'in-progress', user: { name: 'Preeti Deshmukh', email: 'preeti@gmail.com' }, description: 'Requesting status update on order cancellation refund process.', messages: [], updatedAt: new Date().toISOString() }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      toast.error('Validation Error', 'Subject and Description are required.');
      return;
    }

    const payload = {
      subject: newSubject.trim(),
      description: newDescription.trim(),
      category: newCategory,
      priority: newPriority,
      userEmail: userEmail.trim() || undefined
    };

    try {
      const res = await api.post('/tickets', payload);
      if (res.data?.status === 'success') {
        toast.success('Ticket Opened', `Ticket created successfully.`);
        setIsCreateModalOpen(false);
        setNewSubject('');
        setNewDescription('');
        loadTickets();
      }
    } catch {
      const tckNum = 'TCK-' + Math.floor(100000 + Math.random() * 900000).toString();
      const newTck: TicketItem = {
        _id: 'tck-' + Date.now(),
        ticketNumber: tckNum,
        subject: newSubject.trim(),
        description: newDescription.trim(),
        category: newCategory,
        priority: newPriority,
        status: 'open',
        user: { name: userEmail ? userEmail.split('@')[0] : 'Corporate Account', email: userEmail || 'support@enterprise.in' },
        messages: [{ sender: { name: 'Staff' }, message: newDescription, createdAt: new Date().toISOString() }],
        updatedAt: new Date().toISOString()
      };
      setTickets([newTck, ...tickets]);
      toast.success('Ticket Opened', `Ticket ${tckNum} created locally.`);
      setIsCreateModalOpen(false);
      setNewSubject('');
      setNewDescription('');
    }
  };

  const handleStartEditTicket = (tck: TicketItem) => {
    setEditingTicket(tck);
    setEditCategory(tck.category);
    setEditPriority(tck.priority);
    setEditStatus(tck.status);
  };

  const handleUpdateTicketDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;
    const tckId = editingTicket._id || editingTicket.id || editingTicket.ticketNumber;

    const payload = {
      category: editCategory,
      priority: editPriority,
      status: editStatus
    };

    try {
      await api.put(`/tickets/${tckId}/status`, payload);
      toast.success('Ticket Updated', `Ticket parameters updated.`);
      setEditingTicket(null);
      loadTickets();
    } catch {
      setTickets(tickets.map(t => (t._id === tckId || t.id === tckId || t.ticketNumber === tckId) ? {
        ...t,
        category: editCategory,
        priority: editPriority,
        status: editStatus
      } : t));
      toast.success('Ticket Updated', `Ticket updated locally.`);
      setEditingTicket(null);
    }
  };

  const handleDeleteTicket = async () => {
    if (!deletingTicket) return;
    const tckId = deletingTicket._id || deletingTicket.id || deletingTicket.ticketNumber;
    try {
      await api.delete(`/tickets/${tckId}`);
      toast.success('Ticket Deleted', `Ticket removed from queue.`);
      setDeletingTicket(null);
      loadTickets();
    } catch {
      setTickets(tickets.filter(t => (t._id || t.id || t.ticketNumber) !== tckId));
      toast.success('Ticket Deleted', `Ticket deleted locally.`);
      setDeletingTicket(null);
    }
  };

  const handleOpenChat = async (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setIsChatPopupOpen(true);
    try {
      const res = await api.get(`/tickets/details/${ticket.ticketNumber}`);
      if (res.data?.data) {
        setSelectedTicket(res.data.data);
      }
    } catch {
      console.warn('API error fetching ticket details');
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
      const updatedMessages = [...(selectedTicket.messages || []), { sender: { name: 'You (Staff)', role: 'admin' }, message: chatMessage, createdAt: new Date().toISOString() }];
      const updatedTicket: TicketItem = { ...selectedTicket, messages: updatedMessages, status: 'in-progress' };
      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => t.ticketNumber === selectedTicket.ticketNumber ? updatedTicket : t));
      setChatMessage('');
      toast.success('Offline Reply Saved', 'Saved locally.');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'open') {
      return <span className="bg-blue-500/10 text-accent-blue border border-accent-blue/20 px-2 py-0.5 rounded text-[10px] font-bold capitalize">{status}</span>;
    }
    if (status === 'resolved') {
      return <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold capitalize">{status}</span>;
    }
    if (status === 'closed') {
      return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded text-[10px] font-bold capitalize">{status}</span>;
    }
    return <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded text-[10px] font-bold capitalize">{status}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'urgent' || priority === 'high') {
      return <span className="text-red-500 font-bold uppercase text-[9px]">{priority}</span>;
    }
    return <span className="text-slate-400 font-semibold uppercase text-[9px]">{priority}</span>;
  };

  const filteredTickets = tickets.filter(tck => {
    const matchesSearch =
      tck.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tck.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tck.user?.name && tck.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tck.user?.email && tck.user.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || tck.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || tck.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || tck.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-primary-500 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold">Support Tickets Queue</h2>
          <p className="text-xs text-slate-400 mt-1">Manage helpdesk query tickets, triage priority issues, and reply to customers.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-accent-blue/20"
          >
            <Plus size={14} /> Open Support Ticket
          </button>
          <button 
            onClick={loadTickets} 
            className="btn-secondary text-xs font-semibold py-2 px-3.5 rounded-xl border flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Queue Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ticket ref, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none border border-transparent focus:border-accent-blue"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-primary-500"
        >
          <option value="all">All Statuses ({tickets.length})</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full px-3 py-2 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-primary-500"
        >
          <option value="all">All Categories</option>
          <option value="technical">Technical</option>
          <option value="billing">Billing</option>
          <option value="sales">Sales</option>
          <option value="general">General</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-full px-3 py-2 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-primary-500"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tickets Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
          <MessageSquare size={32} />
          <span>No tickets found matching current filters.</span>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
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
                {filteredTickets.map((tck) => (
                  <tr key={tck.ticketNumber} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                    <td className="px-6 py-4 font-mono font-bold text-accent-blue">
                      <span>{tck.ticketNumber}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <span className="font-bold text-slate-800 dark:text-slate-100 block">{tck.user?.name || 'Enterprise Customer'}</span>
                      <span className="text-[10px] text-slate-400 block">{tck.user?.email}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 truncate max-w-xs">{tck.subject}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className="font-semibold block">{tck.category}</span>
                      {getPriorityBadge(tck.priority)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tck.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenChat(tck)}
                          className="bg-accent-blue/10 text-accent-blue hover:bg-accent-blue hover:text-white py-1 px-2.5 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all"
                        >
                          <MessageSquare size={12} /> Chat
                        </button>
                        <button
                          onClick={() => handleStartEditTicket(tck)}
                          title="Edit Ticket"
                          className="p-1.5 rounded-lg bg-blue-500/10 text-accent-blue hover:bg-accent-blue hover:text-white transition-all"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingTicket(tck)}
                          title="Delete Ticket"
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CREATE TICKET MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus size={16} className="text-accent-blue" /> Create Support Ticket
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Customer Email (Optional)</span>
                <input
                  type="email"
                  placeholder="e.g. client@company.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Ticket Subject *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. License key error on POS system"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Category</span>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                  >
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="sales">Sales</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Priority Level</span>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Problem Description *</span>
                <textarea
                  required
                  placeholder="Detailed explanation..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="input-field py-2 resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Open Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT TICKET MODAL --- */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 size={16} className="text-accent-blue" /> Edit Ticket Settings
              </h3>
              <button onClick={() => setEditingTicket(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateTicketDetails} className="space-y-4 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-primary-800 font-mono text-[11px] text-accent-blue font-bold">
                Ticket: {editingTicket.ticketNumber} — "{editingTicket.subject}"
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Category</span>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                >
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="sales">Sales</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Priority Level</span>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Queue Status</span>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingTicket(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Save Ticket Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CHAT POPUP MODAL --- */}
      {isChatPopupOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-0 flex flex-col h-[550px] animate-fade-in relative bg-white dark:bg-primary-700 rounded-3xl overflow-hidden border border-slate-100 dark:border-primary-500/20 shadow-2xl text-xs">
            
            {/* Chat Header */}
            <div className="bg-primary-500 text-white p-4 flex items-center justify-between dark:bg-primary-600">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-primary-200">Ref: {selectedTicket.ticketNumber}</span>
                  {getStatusBadge(selectedTicket.status)}
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
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-primary-800/30">
              <div className="flex flex-col space-y-1 items-start">
                <span className="text-[9px] text-slate-400 font-bold">{selectedTicket.user?.name || 'Customer'} (Original Description)</span>
                <div className="p-3 bg-slate-200/60 dark:bg-primary-600 rounded-2xl rounded-tl-none leading-relaxed text-left">
                  {selectedTicket.description}
                </div>
              </div>

              {selectedTicket.messages && selectedTicket.messages.map((msg: any, i: number) => {
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
                className="btn-primary py-2 px-4 text-xs font-bold rounded-xl shrink-0 flex items-center gap-1"
              >
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE TICKET MODAL --- */}
      {deletingTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Delete Ticket?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete ticket <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{deletingTicket.ticketNumber}</span>?
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setDeletingTicket(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDeleteTicket} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Delete Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTickets;
