import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, Plus, Edit3, Trash2, Mail, Calendar, UserCheck, Search, X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../utils/ToastContext';

interface UserItem {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: 'customer' | 'employee' | 'admin';
  phone?: string;
  isVerified?: boolean;
  createdAt?: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const toast = useToast();

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'employee' | 'admin'>('customer');
  const [isVerified, setIsVerified] = useState(true);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'customer' | 'employee' | 'admin'>('customer');
  const [editIsVerified, setEditIsVerified] = useState(true);

  // Delete User Modal State
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/users');
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch {
      console.warn('API error, using offline users list fallback');
      if (users.length === 0) {
        setUsers([
          { _id: 'u-1', name: 'Alok Gupta', email: 'alok.gupta@enterprise.in', role: 'customer', phone: '+91 9876501234', isVerified: true, createdAt: new Date().toISOString() },
          { _id: 'u-2', name: 'Nisha Mehta', email: 'nisha@office-corp.co.in', role: 'customer', phone: '+91 9123409876', isVerified: true, createdAt: new Date().toISOString() },
          { _id: 'u-3', name: 'Administrator Chief', email: 'admin@test.com', role: 'admin', phone: '+91 9876543210', isVerified: true, createdAt: new Date().toISOString() },
          { _id: 'u-4', name: 'Staff Clerk', email: 'employee@test.com', role: 'employee', phone: '+91 9123456789', isVerified: true, createdAt: new Date().toISOString() }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error('Validation Error', 'Name, email, and password are required.');
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      phone: phone.trim() || undefined,
      isVerified
    };

    try {
      const res = await api.post('/admin/users', payload);
      if (res.data?.status === 'success') {
        toast.success('User Created', `User account ${name} created.`);
        setIsCreateModalOpen(false);
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        loadUsers();
      }
    } catch {
      const newUser: UserItem = {
        _id: 'u-' + Date.now(),
        name: name.trim(),
        email: email.trim(),
        role,
        phone: phone.trim() || undefined,
        isVerified,
        createdAt: new Date().toISOString()
      };
      setUsers([newUser, ...users]);
      toast.success('User Created', `User account ${name} added locally.`);
      setIsCreateModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
    }
  };

  const handleStartEdit = (u: UserItem) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPhone(u.phone || '');
    setEditRole(u.role);
    setEditIsVerified(u.isVerified !== undefined ? u.isVerified : true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const userId = editingUser._id || editingUser.id || editingUser.email;

    const payload = {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      role: editRole,
      isVerified: editIsVerified
    };

    try {
      await api.put(`/admin/users/${userId}`, payload);
      toast.success('User Updated', `Account details updated.`);
      setEditingUser(null);
      loadUsers();
    } catch {
      setUsers(users.map(u => (u._id === userId || u.id === userId || u.email === userId) ? {
        ...u,
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        role: editRole,
        isVerified: editIsVerified
      } : u));
      toast.success('User Updated', `Account details updated locally.`);
      setEditingUser(null);
    }
  };

  const handleQuickRoleChange = async (userId: string, name: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('Role Updated', `${name} is now a ${newRole}.`);
      loadUsers();
    } catch {
      setUsers(users.map(u => (u.id === userId || u._id === userId || u.email === userId) ? { ...u, role: newRole as any } : u));
      toast.success('Role Updated', `${name} role updated locally.`);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    const userId = deletingUser._id || deletingUser.id || deletingUser.email;

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User Deleted', `User account deleted.`);
      setDeletingUser(null);
      loadUsers();
    } catch {
      setUsers(users.filter(u => (u._id || u.id || u.email) !== userId));
      toast.success('User Deleted', `User account deleted locally.`);
      setDeletingUser(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-primary-500 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold">User Access Management</h2>
          <p className="text-xs text-slate-400 mt-1">View, edit profiles, manage verification status, and set roles for registered user accounts.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-accent-blue/20"
          >
            <Plus size={14} /> Create User Account
          </button>
          <button 
            onClick={loadUsers} 
            className="btn-secondary text-xs font-semibold py-2 px-3.5 rounded-xl border flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh List
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none border border-transparent focus:border-accent-blue"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-primary-800 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-primary-500"
          >
            <option value="all">All Account Types ({users.length})</option>
            <option value="customer">Customers</option>
            <option value="employee">Staff Members</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
          <UserCheck size={32} />
          <span>No user accounts found matching criteria.</span>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-primary-500 bg-slate-50 dark:bg-primary-700/50">
                  <th className="px-6 py-4 font-bold text-slate-400">User Details</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Email & Contact</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Status</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Registered</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Access Role</th>
                  <th className="px-6 py-4 font-bold text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const userId = u._id || u.id || u.email;
                  return (
                    <tr key={u.email} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center font-extrabold text-[10px]">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400 dark:text-slate-300">
                        <span className="flex items-center gap-1"><Mail size={11} /> {u.email}</span>
                        {u.phone && <span className="text-[10px] text-slate-400 block mt-0.5">{u.phone}</span>}
                      </td>
                      <td className="px-6 py-4">
                        {u.isVerified !== false ? (
                          <span className="flex items-center gap-1 text-green-500 font-bold text-[10px]">
                            <CheckCircle size={12} /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-500 font-bold text-[10px]">
                            <XCircle size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          u.role === 'admin' 
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                            : u.role === 'employee'
                              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                              : 'bg-green-500/10 text-green-500 border border-green-500/20'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <select 
                            value={u.role} 
                            onChange={(e) => handleQuickRoleChange(userId, u.name, e.target.value)}
                            className="px-2 py-1 bg-slate-50 dark:bg-primary-600 rounded-lg text-[10px] outline-none border border-slate-200 dark:border-primary-500/35 font-bold"
                          >
                            <option value="customer">Customer</option>
                            <option value="employee">Staff / Employee</option>
                            <option value="admin">Administrator</option>
                          </select>
                          <button
                            onClick={() => handleStartEdit(u)}
                            title="Edit User Account"
                            className="p-1.5 rounded-lg bg-blue-500/10 text-accent-blue hover:bg-accent-blue hover:text-white transition-all"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => setDeletingUser(u)}
                            title="Delete User Account"
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

      {/* --- CREATE USER MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus size={16} className="text-accent-blue" /> Create User Account
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Full Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anish Saxena"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Email Address *</span>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Password *</span>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Role</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                  >
                    <option value="customer">Customer</option>
                    <option value="employee">Staff / Employee</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Phone Number (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createVerified"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="rounded text-accent-blue focus:ring-accent-blue"
                />
                <label htmlFor="createVerified" className="font-semibold text-slate-600 dark:text-slate-300">
                  Mark Account as Email Verified
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 size={16} className="text-accent-blue" /> Edit User Profile
              </h3>
              <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Full Name</span>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Email Address</span>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Phone Contact</span>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Role</span>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                  >
                    <option value="customer">Customer</option>
                    <option value="employee">Staff / Employee</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editVerified"
                  checked={editIsVerified}
                  onChange={(e) => setEditIsVerified(e.target.checked)}
                  className="rounded text-accent-blue focus:ring-accent-blue"
                />
                <label htmlFor="editVerified" className="font-semibold text-slate-600 dark:text-slate-300">
                  Account Verified Status
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
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

      {/* --- DELETE USER MODAL --- */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Delete User Account?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete user account <span className="font-bold text-slate-700 dark:text-slate-200">"{deletingUser.name}"</span> ({deletingUser.email})?
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setDeletingUser(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDeleteUser} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
