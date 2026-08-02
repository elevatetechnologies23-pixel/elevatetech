import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  RefreshCw, 
  Video, 
  Edit3, 
  Trash2, 
  Search, 
  X, 
  AlertTriangle, 
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle,
  Building,
  Mail,
  Phone
} from 'lucide-react';
import { useToast } from '../../utils/ToastContext';

interface DemoItem {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  productInterest: string;
  preferredDate: string;
  preferredTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
  createdAt?: string;
}

const AdminDemos: React.FC = () => {
  const [demos, setDemos] = useState<DemoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const toast = useToast();

  // Edit Modal State
  const [editingDemo, setEditingDemo] = useState<DemoItem | null>(null);
  const [editStatus, setEditStatus] = useState<'pending' | 'confirmed' | 'completed' | 'cancelled'>('confirmed');
  const [editMeetingLink, setEditMeetingLink] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Delete Modal State
  const [deletingDemo, setDeletingDemo] = useState<DemoItem | null>(null);

  const loadDemos = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/demos/admin-list');
      if (res.data?.data) {
        setDemos(res.data.data);
      }
    } catch {
      console.warn('Failed to load demo appointments via API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDemos();
  }, []);

  const handleStartEdit = (demo: DemoItem) => {
    setEditingDemo(demo);
    setEditStatus(demo.status);
    setEditMeetingLink(demo.meetingLink || '');
    setEditNotes(demo.notes || '');
  };

  const handleUpdateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDemo) return;
    const id = editingDemo._id || editingDemo.id;

    try {
      await api.put(`/demos/${id}`, {
        status: editStatus,
        meetingLink: editMeetingLink.trim(),
        notes: editNotes.trim()
      });
      toast.success('Demo Appointment Updated', `Status updated to ${editStatus}.`);
      setEditingDemo(null);
      loadDemos();
    } catch {
      toast.error('API Error', 'Failed to update appointment.');
    }
  };

  const handleDeleteDemo = async () => {
    if (!deletingDemo) return;
    const id = deletingDemo._id || deletingDemo.id;
    try {
      await api.delete(`/demos/${id}`);
      toast.success('Demo Request Deleted', `Appointment entry removed.`);
      setDeletingDemo(null);
      loadDemos();
    } catch {
      toast.error('API Error', 'Failed to delete entry.');
    }
  };

  const filteredDemos = demos.filter(d => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = d.name.toLowerCase().includes(query) || 
                         (d.companyName || '').toLowerCase().includes(query) || 
                         d.email.toLowerCase().includes(query) ||
                         d.productInterest.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-primary-500 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Video className="text-accent-blue" size={24} /> Live Product Demo Appointments
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage 1-on-1 Zoom/Google Meet demonstration requests from enterprise buyers.</p>
        </div>

        <button 
          onClick={loadDemos} 
          className="btn-secondary text-xs font-semibold py-2 px-3.5 rounded-xl border flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh List
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="relative max-w-md w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name, email, company or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none border border-transparent focus:border-accent-blue"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-slate-400 font-semibold shrink-0">Filter Status:</span>
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all shrink-0 ${statusFilter === st ? 'bg-accent-blue text-white' : 'bg-slate-100 dark:bg-primary-800 text-slate-500'}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Demos Grid List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredDemos.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
          <Video size={32} />
          <span>No live demo appointments found.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDemos.map((d) => (
            <div 
              key={d._id || d.id}
              className="glass-card p-6 flex flex-col justify-between border border-slate-200/60 dark:border-primary-500/30 rounded-3xl space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    d.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                    d.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    d.status === 'completed' ? 'bg-blue-500/10 text-accent-blue border border-blue-500/20' :
                    'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {d.status}
                  </span>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <Calendar size={12} className="text-accent-blue" />
                    <span>{d.preferredDate} ({d.preferredTime})</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">{d.name}</h4>
                  <p className="text-xs text-slate-400 font-semibold">{d.companyName || 'Corporate Buyer'}</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-primary-800 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Mail size={12} className="text-accent-blue shrink-0" />
                    <span className="truncate">{d.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Phone size={12} className="text-accent-blue shrink-0" />
                    <span>{d.phone}</span>
                  </div>
                  <div className="pt-1 text-[11px] font-bold text-accent-blue">
                    Interest: {d.productInterest}
                  </div>
                </div>

                {d.notes && (
                  <p className="text-[11px] text-slate-400 italic">
                    "{d.notes}"
                  </p>
                )}

                {d.meetingLink && (
                  <a
                    href={d.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-accent-blue font-bold hover:underline"
                  >
                    <ExternalLink size={12} /> Launch Meeting Link
                  </a>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-primary-500/20 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  Requested: {new Date(d.createdAt || Date.now()).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(d)}
                    className="p-1.5 rounded-lg bg-blue-500/10 text-accent-blue hover:bg-accent-blue hover:text-white transition-all"
                    title="Edit Status & Meeting Link"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingDemo(d)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    title="Delete Request"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- EDIT DEMO MODAL --- */}
      {editingDemo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-xs text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 size={16} className="text-accent-blue" /> Update Demo Request ({editingDemo.name})
              </h3>
              <button onClick={() => setEditingDemo(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateDemo} className="space-y-4">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Appointment Status</span>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                >
                  <option value="pending">Pending Review</option>
                  <option value="confirmed">Confirmed &amp; Scheduled</option>
                  <option value="completed">Completed Demo</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Google Meet / Zoom URL</span>
                <input
                  type="text"
                  placeholder="https://meet.google.com/xyz-abc-123"
                  value={editMeetingLink}
                  onChange={(e) => setEditMeetingLink(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Internal Admin Notes</span>
                <textarea
                  rows={2}
                  placeholder="e.g. Assigned to Product Specialist Rahul..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="input-field py-2 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingDemo(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRM MODAL --- */}
      {deletingDemo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Delete Demo Request?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete demo appointment for <span className="font-bold text-slate-700 dark:text-slate-200">"{deletingDemo.name}"</span>?
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setDeletingDemo(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDeleteDemo} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Delete Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDemos;
