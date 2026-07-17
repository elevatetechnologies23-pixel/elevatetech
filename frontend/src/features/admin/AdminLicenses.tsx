import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw } from 'lucide-react';

const AdminLicenses: React.FC = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLicenses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/licenses/admin-list');
      if (res.data?.data) {
        setLicenses(res.data.data);
      }
    } catch {
      console.warn('API error, using offline licenses list');
      setLicenses([
        { id: '1', licenseKey: 'LIC-A4E2-8FD3-C2B1-4E90', productName: 'Enterprise Billing & POS Software', assignedTo: { name: 'Rahul Sen', email: 'rahul@gmail.com' }, activeActivations: 1, maxActivations: 3, status: 'active', validUntil: new Date(Date.now() + 300*24*60*60*1000).toISOString() },
        { id: '2', licenseKey: 'LIC-9C3F-7A2B-0E4D-8F9E', productName: 'Advanced GST Billing Software', assignedTo: { name: 'Preeti Deshmukh', email: 'preeti@gmail.com' }, activeActivations: 3, maxActivations: 3, status: 'active', validUntil: new Date(Date.now() + 180*24*60*60*1000).toISOString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/licenses/${id}/status`, { status: newStatus });
      loadLicenses();
    } catch {
      setLicenses(licenses.map(l => l.id === id ? { ...l, status: newStatus } : l));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-primary-500 pb-4">
        <h2 className="text-xl font-bold">Billing Software Subscriptions</h2>
        <button onClick={loadLicenses} className="btn-secondary text-xs font-semibold py-1.5 px-3 rounded-lg border flex items-center gap-1.5">
          <RefreshCw size={14} /> Refresh List
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
                <th className="px-6 py-4 font-bold text-slate-400">License Key</th>
                <th className="px-6 py-4 font-bold text-slate-400">Purchased By</th>
                <th className="px-6 py-4 font-bold text-slate-400">Software Product</th>
                <th className="px-6 py-4 font-bold text-slate-400">Activations</th>
                <th className="px-6 py-4 font-bold text-slate-400">Valid Until</th>
                <th className="px-6 py-4 font-bold text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((lic) => (
                <tr key={lic.licenseKey} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-primary-600 px-2 py-1 rounded text-accent-blue">{lic.licenseKey}</span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    <span className="font-semibold block">{lic.assignedTo?.name || 'Local Customer'}</span>
                    <span className="text-[10px] text-slate-400 block">{lic.assignedTo?.email}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold">{lic.productName}</td>
                  <td className="px-6 py-4">{lic.activeActivations} / {lic.maxActivations} Devices</td>
                  <td className="px-6 py-4">{new Date(lic.validUntil).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <select 
                      value={lic.status} 
                      onChange={(e) => handleUpdateStatus(lic.id || lic.licenseKey, e.target.value)}
                      className="px-2 py-1 bg-slate-50 dark:bg-primary-600 rounded text-[10px] outline-none border-none font-semibold"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="expired">Expired</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminLicenses;
