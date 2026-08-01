import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  RefreshCw, 
  Trash2, 
  Clock, 
  ShieldAlert, 
  AlertTriangle, 
  Search
} from 'lucide-react';
import { useToast } from '../../utils/ToastContext';

interface LogItem {
  _id?: string;
  id?: string;
  action: string;
  details: string;
  createdAt: string;
  user?: { name?: string; email?: string; role?: string };
  ipAddress?: string;
}

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  // Modals state
  const [deletingLog, setDeletingLog] = useState<LogItem | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearOldModalOpen, setIsClearOldModalOpen] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/logs');
      if (res.data?.data) {
        setLogs(res.data.data);
      }
    } catch {
      console.warn('API error, using fallback logs list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleDeleteSingleLog = async () => {
    if (!deletingLog) return;
    const logId = deletingLog._id || deletingLog.id;
    try {
      await api.delete(`/admin/logs/${logId}`);
      toast.success('Log Entry Deleted', 'Audit log entry removed.');
      setDeletingLog(null);
      loadLogs();
    } catch {
      toast.error('API Error', 'Failed to delete log entry.');
    }
  };

  const handleClearAllLogs = async () => {
    try {
      await api.delete('/admin/logs/clear-all');
      toast.success('All Audit Logs Cleared', 'System audit log history wiped.');
      setIsClearAllModalOpen(false);
      loadLogs();
    } catch {
      toast.error('API Error', 'Failed to clear audit logs.');
    }
  };

  const handleClearOldLogs = async () => {
    try {
      const res = await api.delete('/admin/logs/clear-old');
      toast.success('30-Day Cleanup Complete', res.data?.message || 'Older logs cleared.');
      setIsClearOldModalOpen(false);
      loadLogs();
    } catch {
      toast.error('API Error', 'Failed to purge old audit logs.');
    }
  };

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase();
    const action = log.action.toLowerCase();
    const details = log.details.toLowerCase();
    const actor = (log.user?.name || log.user?.email || '').toLowerCase();
    return action.includes(query) || details.includes(query) || actor.includes(query);
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-primary-500 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-accent-blue" size={24} /> System Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track user logins, orders, license activations, and system administrative changes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsClearOldModalOpen(true)}
            className="btn-secondary text-xs font-semibold py-2 px-3 rounded-xl border flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            title="Purge logs older than 30 days"
          >
            <Clock size={14} /> Clear Logs &gt; 30 Days
          </button>
          <button 
            onClick={() => setIsClearAllModalOpen(true)}
            className="btn-secondary text-xs font-semibold py-2 px-3 rounded-xl border flex items-center gap-1.5 text-red-500 border-red-500/30 hover:bg-red-500/10"
            title="Clear all system audit logs"
          >
            <Trash2 size={14} /> Clear All Logs
          </button>
          <button 
            onClick={loadLogs} 
            className="btn-secondary text-xs font-semibold py-2 px-3 rounded-xl border flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Auto-Expiration Notice Banner */}
      <div className="p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-2xl flex items-center justify-between text-xs text-slate-700 dark:text-slate-200">
        <div className="flex items-center gap-2.5">
          <Clock size={18} className="text-accent-blue shrink-0" />
          <span>
            <strong>Automatic 30-Day TTL Retention Active:</strong> Audit log entries older than 30 days are automatically purged from the MongoDB database.
          </span>
        </div>
        <span className="bg-accent-blue/20 text-accent-blue px-2.5 py-0.5 rounded-full font-bold text-[10px] shrink-0">
          30-Day Auto Purge
        </span>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md text-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search logs by actor, action type, or audit details..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none border border-transparent focus:border-accent-blue"
        />
      </div>

      {/* Audit Logs Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
          <ShieldAlert size={32} />
          <span>No audit log records found.</span>
        </div>
      ) : (
        <div className="glass-card overflow-x-auto rounded-3xl border border-slate-200/60 dark:border-primary-500/30">
          <table className="w-full text-xs text-left min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-primary-500 bg-slate-50 dark:bg-primary-700/50">
                <th className="px-6 py-4 font-bold text-slate-400">Timestamp</th>
                <th className="px-6 py-4 font-bold text-slate-400">Actor</th>
                <th className="px-6 py-4 font-bold text-slate-400">Action Type</th>
                <th className="px-6 py-4 font-bold text-slate-400">Audit Details</th>
                <th className="px-6 py-4 font-bold text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr 
                  key={log._id || log.id || log.createdAt} 
                  className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold block text-slate-800 dark:text-slate-100">{log.user?.name || log.user?.email || 'System Auto'}</span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">{log.user?.role || 'Guest / System'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-accent-blue/10 text-accent-blue px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono border border-accent-blue/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium leading-relaxed max-w-md">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setDeletingLog(log)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      title="Delete Log Entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- SINGLE LOG DELETE CONFIRM MODAL --- */}
      {deletingLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Delete Audit Log Entry?</h3>
            <p className="text-xs text-slate-400">
              Delete entry <span className="font-mono font-bold text-accent-blue">[{deletingLog.action}]</span>? This operation cannot be undone.
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setDeletingLog(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDeleteSingleLog} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CLEAR OLD LOGS MODAL (>30 DAYS) --- */}
      {isClearOldModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Clock size={24} />
            </div>
            <h3 className="font-bold text-sm">Purge Logs Older Than 30 Days?</h3>
            <p className="text-xs text-slate-400">
              This will remove all system audit records timestamped prior to 30 days ago.
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setIsClearOldModalOpen(false)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleClearOldLogs} className="bg-amber-500 hover:bg-amber-600 text-white py-2 flex-1 rounded-xl font-bold">
                Purge &gt; 30 Days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CLEAR ALL LOGS MODAL --- */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Clear Entire Audit History?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently clear <span className="font-bold text-red-500">ALL</span> system audit log entries?
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setIsClearAllModalOpen(false)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleClearAllLogs} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Clear All Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
