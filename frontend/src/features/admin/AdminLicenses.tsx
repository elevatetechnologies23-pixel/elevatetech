import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, Plus, Edit3, Trash2, Key, Search, X, AlertTriangle, ShieldCheck, Laptop } from 'lucide-react';
import { useToast } from '../../utils/ToastContext';
import { shareLicenseOnWhatsApp } from '../../utils/whatsappService';

interface LicenseItem {
  _id?: string;
  id?: string;
  licenseKey: string;
  productName: string;
  assignedTo?: { _id?: string; name?: string; email?: string } | any;
  activeActivations: number;
  maxActivations: number;
  macAddresses?: string[];
  status: 'active' | 'suspended' | 'expired';
  validUntil: string;
}

const AdminLicenses: React.FC = () => {
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const toast = useToast();

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('Enterprise Billing & POS Software');
  const [newAssignedEmail, setNewAssignedEmail] = useState('');
  const [newMaxActivations, setNewMaxActivations] = useState(3);
  const [newValidDays, setNewValidDays] = useState(365);
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'expired'>('active');

  // Edit Modal State
  const [editingLicense, setEditingLicense] = useState<LicenseItem | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editMaxActivations, setEditMaxActivations] = useState(3);
  const [editValidUntil, setEditValidUntil] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended' | 'expired'>('active');

  // Delete Modal State
  const [deletingLicense, setDeletingLicense] = useState<LicenseItem | null>(null);

  // View Devices Modal State
  const [viewingDevicesLicense, setViewingDevicesLicense] = useState<LicenseItem | null>(null);

  const loadLicenses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/licenses/admin-list');
      if (res.data?.data) {
        setLicenses(res.data.data);
      }
    } catch {
      console.warn('API error, using offline licenses list');
      if (licenses.length === 0) {
        setLicenses([
          { _id: 'lic-1', licenseKey: 'LIC-A4E2-8FD3-C2B1-4E90', productName: 'Enterprise Billing & POS Software', assignedTo: { name: 'Rahul Sen', email: 'rahul@gmail.com' }, activeActivations: 1, maxActivations: 3, macAddresses: ['00-14-22-01-23-45'], status: 'active', validUntil: new Date(Date.now() + 300*24*60*60*1000).toISOString() },
          { _id: 'lic-2', licenseKey: 'LIC-9C3F-7A2B-0E4D-8F9E', productName: 'Advanced GST Billing Software', assignedTo: { name: 'Preeti Deshmukh', email: 'preeti@gmail.com' }, activeActivations: 3, maxActivations: 3, macAddresses: ['00-1B-44-11-3A-B7', 'A4-5E-60-77-88-99', 'C2-88-99-00-11-22'], status: 'active', validUntil: new Date(Date.now() + 180*24*60*60*1000).toISOString() },
          { _id: 'lic-3', licenseKey: 'LIC-5K9L-2M4N-6P8R-1T3V', productName: 'Retail Store Inventory & Billing POS', assignedTo: { name: 'Vikram Malhotra', email: 'vikram@retail.in' }, activeActivations: 0, maxActivations: 5, macAddresses: [], status: 'suspended', validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString() }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, []);

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    const validUntilDate = new Date(Date.now() + newValidDays * 24 * 60 * 60 * 1000).toISOString();

    const payload = {
      productName: newProductName,
      assignedToEmail: newAssignedEmail.trim(),
      maxActivations: newMaxActivations,
      validUntil: validUntilDate,
      status: newStatus
    };

    try {
      const res = await api.post('/licenses/create', payload);
      if (res.data?.status === 'success') {
        toast.success('Subscription Issued', `License key successfully created.`);
        setIsCreateModalOpen(false);
        loadLicenses();
      }
    } catch {
      // Offline fallback
      const randomHex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      const mockKey = `LIC-${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}`;
      const newLic: LicenseItem = {
        _id: 'lic-' + Date.now(),
        licenseKey: mockKey,
        productName: newProductName,
        assignedTo: { name: newAssignedEmail ? newAssignedEmail.split('@')[0] : 'Corporate Account', email: newAssignedEmail || 'corporate@enterprise.in' },
        activeActivations: 0,
        maxActivations: newMaxActivations,
        macAddresses: [],
        status: newStatus,
        validUntil: validUntilDate
      };
      setLicenses([newLic, ...licenses]);
      toast.success('Subscription Issued', `License key ${mockKey} generated locally.`);
      setIsCreateModalOpen(false);
    }
  };

  const handleStartEdit = (lic: LicenseItem) => {
    setEditingLicense(lic);
    setEditProductName(lic.productName);
    setEditMaxActivations(lic.maxActivations);
    setEditValidUntil(lic.validUntil ? new Date(lic.validUntil).toISOString().split('T')[0] : '');
    setEditStatus(lic.status);
  };

  const handleUpdateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLicense) return;
    const licId = editingLicense._id || editingLicense.id;

    const payload = {
      productName: editProductName,
      maxActivations: editMaxActivations,
      validUntil: new Date(editValidUntil).toISOString(),
      status: editStatus
    };

    try {
      await api.put(`/licenses/${licId}`, payload);
      toast.success('Subscription Updated', `License settings saved.`);
      setEditingLicense(null);
      loadLicenses();
    } catch {
      setLicenses(licenses.map(l => (l._id === licId || l.id === licId || l.licenseKey === editingLicense.licenseKey) ? {
        ...l,
        productName: editProductName,
        maxActivations: editMaxActivations,
        validUntil: new Date(editValidUntil).toISOString(),
        status: editStatus
      } : l));
      toast.success('Subscription Updated', `Updated offline.`);
      setEditingLicense(null);
    }
  };

  const handleQuickStatusChange = async (licId: string, newStat: 'active' | 'suspended' | 'expired') => {
    try {
      await api.put(`/licenses/${licId}/status`, { status: newStat });
      toast.success('Status Changed', `Status updated to ${newStat}.`);
      loadLicenses();
    } catch {
      setLicenses(licenses.map(l => (l._id === licId || l.id === licId || l.licenseKey === licId) ? { ...l, status: newStat } : l));
      toast.success('Status Changed', `Status updated locally.`);
    }
  };

  const handleDeleteLicense = async () => {
    if (!deletingLicense) return;
    const licId = deletingLicense._id || deletingLicense.id || deletingLicense.licenseKey;
    try {
      await api.delete(`/licenses/${licId}`);
      toast.success('Subscription Revoked', `License deleted.`);
      setDeletingLicense(null);
      loadLicenses();
    } catch {
      setLicenses(licenses.filter(l => (l._id || l.id || l.licenseKey) !== licId));
      toast.success('Subscription Revoked', `License removed locally.`);
      setDeletingLicense(null);
    }
  };

  const handleDeactivateMac = async (licenseId: string, mac: string) => {
    try {
      await api.put(`/licenses/${licenseId}/deactivate-mac`, { macAddress: mac });
      toast.success('Device Unbound', `MAC ${mac} deactivated.`);
      loadLicenses();
    } catch {
      setLicenses(licenses.map(l => {
        if (l._id === licenseId || l.id === licenseId || l.licenseKey === licenseId) {
          const updatedMacs = (l.macAddresses || []).filter(m => m !== mac);
          return { ...l, macAddresses: updatedMacs, activeActivations: Math.max(0, l.activeActivations - 1) };
        }
        return l;
      }));
      toast.success('Device Unbound', `MAC ${mac} unlinked locally.`);
    }
  };

  const filteredLicenses = licenses.filter(lic => {
    const matchesSearch = 
      lic.licenseKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lic.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lic.assignedTo?.name && lic.assignedTo.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lic.assignedTo?.email && lic.assignedTo.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || lic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-primary-500 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold">Billing Software Subscriptions</h2>
          <p className="text-xs text-slate-400 mt-1">Manage billing software licenses, device seat activations, validity extensions, and security keys.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-accent-blue/20"
          >
            <Plus size={14} /> Issue New License
          </button>
          <button 
            onClick={loadLicenses} 
            className="btn-secondary text-xs font-semibold py-2 px-3.5 rounded-xl border flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by license key, software product, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none border border-transparent focus:border-accent-blue"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-primary-500"
          >
            <option value="all">All Statuses ({licenses.length})</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredLicenses.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
          <Key size={32} />
          <span>No subscription licenses found matching criteria.</span>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-primary-500 bg-slate-50 dark:bg-primary-700/50">
                  <th className="px-6 py-4 font-bold text-slate-400">License Key</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Purchased / Assigned To</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Software Product</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Seat Activations</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Valid Until</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Status</th>
                  <th className="px-6 py-4 font-bold text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map((lic) => {
                  const licId = lic._id || lic.id || lic.licenseKey;
                  return (
                    <tr key={lic.licenseKey} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-primary-600 px-2 py-1 rounded-lg text-accent-blue border border-slate-200 dark:border-primary-500/30">
                          {lic.licenseKey}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">{lic.assignedTo?.name || 'Enterprise Customer'}</span>
                        <span className="text-[10px] text-slate-400 block">{lic.assignedTo?.email || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">{lic.productName}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setViewingDevicesLicense(lic)}
                          className="hover:underline flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200"
                        >
                          <Laptop size={12} className="text-accent-blue" /> {lic.activeActivations} / {lic.maxActivations} Devices
                        </button>
                      </td>
                      <td className="px-6 py-4 font-medium">{new Date(lic.validUntil).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={lic.status} 
                          onChange={(e) => handleQuickStatusChange(licId, e.target.value as any)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] outline-none font-bold capitalize ${
                            lic.status === 'active' 
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                              : lic.status === 'suspended'
                                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="expired">Expired</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => shareLicenseOnWhatsApp(
                              lic.assignedTo?.phone,
                              lic.licenseKey,
                              lic.productName,
                              lic.validUntil
                            )}
                            title="Send License Key via WhatsApp"
                            className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          </button>
                          <button
                            onClick={() => handleStartEdit(lic)}
                            title="Edit License"
                            className="p-1.5 rounded-lg bg-blue-500/10 text-accent-blue hover:bg-accent-blue hover:text-white transition-all"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => setDeletingLicense(lic)}
                            title="Delete License"
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CREATE LICENSE MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-accent-blue" /> Issue New License Key
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Software Product</span>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Customer Work Email</span>
                <input
                  type="email"
                  placeholder="e.g. client@company.com"
                  value={newAssignedEmail}
                  onChange={(e) => setNewAssignedEmail(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Max Device Seats</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={newMaxActivations}
                    onChange={(e) => setNewMaxActivations(Number(e.target.value))}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Validity Period</span>
                  <select
                    value={newValidDays}
                    onChange={(e) => setNewValidDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                  >
                    <option value={30}>1 Month (30 Days)</option>
                    <option value={180}>6 Months (180 Days)</option>
                    <option value={365}>1 Year (365 Days)</option>
                    <option value={1095}>3 Years (1095 Days)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Initial License Status</span>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Generate License Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT LICENSE MODAL --- */}
      {editingLicense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 size={16} className="text-accent-blue" /> Edit Subscription & License
              </h3>
              <button onClick={() => setEditingLicense(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateLicense} className="space-y-4 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-primary-800 font-mono text-[11px] text-accent-blue font-bold">
                Key: {editingLicense.licenseKey}
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Software Product Name</span>
                <input
                  type="text"
                  required
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Max Device Seats</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editMaxActivations}
                    onChange={(e) => setEditMaxActivations(Number(e.target.value))}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Expiration Date</span>
                  <input
                    type="date"
                    required
                    value={editValidUntil}
                    onChange={(e) => setEditValidUntil(e.target.value)}
                    className="input-field py-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Status</span>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingLicense(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW / RELEASE DEVICES MODAL --- */}
      {viewingDevicesLicense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Laptop size={16} className="text-accent-blue" /> Activated Devices ({viewingDevicesLicense.macAddresses?.length || 0} bound)
              </h3>
              <button onClick={() => setViewingDevicesLicense(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {(!viewingDevicesLicense.macAddresses || viewingDevicesLicense.macAddresses.length === 0) ? (
                <p className="text-slate-400 py-4 text-center">No hardware MAC addresses registered yet.</p>
              ) : (
                viewingDevicesLicense.macAddresses.map((mac, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-primary-600 border border-slate-100 dark:border-primary-500/20">
                    <span className="font-mono font-bold text-accent-blue">{mac}</span>
                    <button
                      onClick={() => handleDeactivateMac(viewingDevicesLicense._id || viewingDevicesLicense.id || viewingDevicesLicense.licenseKey, mac)}
                      className="px-2.5 py-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold text-[10px] transition-all"
                    >
                      Unbind Device
                    </button>
                  </div>
                ))
              )}
            </div>

            <button onClick={() => setViewingDevicesLicense(null)} className="btn-secondary w-full py-2 rounded-xl font-bold text-xs mt-2">
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- DELETE LICENSE MODAL --- */}
      {deletingLicense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Delete Subscription License?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete key <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{deletingLicense.licenseKey}</span>? Software instances bound to this key will be revoked immediately.
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setDeletingLicense(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDeleteLicense} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Delete Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLicenses;
