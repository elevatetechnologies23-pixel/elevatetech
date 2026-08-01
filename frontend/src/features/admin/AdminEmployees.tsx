import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, Plus, Edit3, Trash2, ShieldCheck, Search, X, AlertTriangle, UserCheck } from 'lucide-react';
import { useToast } from '../../utils/ToastContext';

interface EmployeeItem {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'customer';
  phone?: string;
}

const AdminEmployees: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const toast = useToast();

  // Create Staff Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');

  // Edit Staff Modal State
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'employee' | 'customer'>('employee');

  // Delete Staff Modal State
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeItem | null>(null);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/employees');
      if (res.data?.data) {
        setEmployees(res.data.data);
      }
    } catch {
      console.warn('API error, using offline employee list');
      if (employees.length === 0) {
        setEmployees([
          { _id: 'emp-1', name: 'Administrator Chief', email: 'admin@test.com', role: 'admin', phone: '+91 9876543210' },
          { _id: 'emp-2', name: 'Staff Clerk', email: 'employee@test.com', role: 'employee', phone: '+91 9123456789' }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
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
      phone: phone.trim() || undefined
    };

    try {
      const res = await api.post('/admin/employees', payload);
      if (res.data?.status === 'success') {
        toast.success('Staff Account Created', `Staff member ${name} created.`);
        setIsCreateModalOpen(false);
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        loadEmployees();
      }
    } catch (err: any) {
      // Offline fallback
      const newEmp: EmployeeItem = {
        _id: 'emp-' + Date.now(),
        name: name.trim(),
        email: email.trim(),
        role,
        phone: phone.trim()
      };
      setEmployees([...employees, newEmp]);
      toast.success('Staff Account Created', `Staff member ${name} added locally.`);
      setIsCreateModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
    }
  };

  const handleStartEdit = (emp: EmployeeItem) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditEmail(emp.email);
    setEditPhone(emp.phone || '');
    setEditRole(emp.role);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    const empId = editingEmployee._id || editingEmployee.id || editingEmployee.email;

    const payload = {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      role: editRole
    };

    try {
      await api.put(`/admin/employees/${empId}`, payload);
      toast.success('Staff Account Updated', `Employee profile updated.`);
      setEditingEmployee(null);
      loadEmployees();
    } catch {
      setEmployees(employees.map(e => (e._id === empId || e.id === empId || e.email === empId) ? {
        ...e,
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        role: editRole
      } : e));
      toast.success('Staff Account Updated', `Profile updated locally.`);
      setEditingEmployee(null);
    }
  };

  const handleQuickRoleChange = async (empId: string, empName: string, newRole: string) => {
    try {
      await api.put(`/admin/employees/${empId}/role`, { role: newRole });
      toast.success('Role Updated', `${empName} role changed to ${newRole}.`);
      loadEmployees();
    } catch {
      setEmployees(employees.map(e => (e._id === empId || e.id === empId || e.email === empId) ? { ...e, role: newRole as any } : e));
      toast.success('Role Updated', `Updated locally.`);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    const empId = deletingEmployee._id || deletingEmployee.id || deletingEmployee.email;
    try {
      await api.delete(`/admin/employees/${empId}`);
      toast.success('Staff Deactivated', `Account removed.`);
      setDeletingEmployee(null);
      loadEmployees();
    } catch {
      setEmployees(employees.filter(e => (e._id || e.id || e.email) !== empId));
      toast.success('Staff Deactivated', `Removed locally.`);
      setDeletingEmployee(null);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.phone && emp.phone.includes(searchQuery));

    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-primary-500 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold">Staff & Access Permissions</h2>
          <p className="text-xs text-slate-400 mt-1">Configure internal employee accounts, security access privileges, and staff roles.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-accent-blue/20"
          >
            <Plus size={14} /> Add Staff Member
          </button>
          <button 
            onClick={loadEmployees} 
            className="btn-secondary text-xs font-semibold py-2 px-3.5 rounded-xl border flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh List
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff name, email, phone..."
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
            <option value="all">All Roles ({employees.length})</option>
            <option value="admin">Administrators</option>
            <option value="employee">Staff / Employees</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
          <ShieldCheck size={32} />
          <span>No staff members found matching criteria.</span>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-primary-500 bg-slate-50 dark:bg-primary-700/50">
                  <th className="px-6 py-4 font-bold text-slate-400">Employee Name</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Work Email</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Phone Contact</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Security Role</th>
                  <th className="px-6 py-4 font-bold text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const empId = emp._id || emp.id || emp.email;
                  return (
                    <tr key={emp.email} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center font-extrabold text-[10px]">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{emp.name}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400 dark:text-slate-300">{emp.email}</td>
                      <td className="px-6 py-4 text-slate-400">{emp.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          emp.role === 'admin' 
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                            : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <select 
                            value={emp.role} 
                            onChange={(e) => handleQuickRoleChange(empId, emp.name, e.target.value)}
                            className="px-2 py-1 bg-slate-50 dark:bg-primary-600 rounded-lg text-[10px] outline-none border border-slate-200 dark:border-primary-500/30 font-bold"
                          >
                            <option value="employee">Employee</option>
                            <option value="admin">Admin</option>
                            <option value="customer">Demote to Customer</option>
                          </select>
                          <button
                            onClick={() => handleStartEdit(emp)}
                            title="Edit Staff"
                            className="p-1.5 rounded-lg bg-blue-500/10 text-accent-blue hover:bg-accent-blue hover:text-white transition-all"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => setDeletingEmployee(emp)}
                            title="Delete Staff"
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

      {/* --- CREATE STAFF MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserCheck size={16} className="text-accent-blue" /> Create Staff Member Account
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Full Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Work Email Address *</span>
                <input
                  type="email"
                  required
                  placeholder="e.g. vikram@enterprise.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Temporary Password *</span>
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
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Security Role</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                  >
                    <option value="employee">Employee / Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Phone Contact (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2 flex-1 rounded-xl font-bold">
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT STAFF MODAL --- */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary-500 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 size={16} className="text-accent-blue" /> Edit Staff Profile
              </h3>
              <button onClick={() => setEditingEmployee(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-4 text-xs">
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
                <span className="font-semibold text-slate-500 dark:text-slate-300">Work Email</span>
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
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Security Role</span>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold text-xs"
                  >
                    <option value="employee">Employee / Staff</option>
                    <option value="admin">Administrator</option>
                    <option value="customer">Demote to Customer</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingEmployee(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
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

      {/* --- DELETE STAFF MODAL --- */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 bg-white dark:bg-primary-700 rounded-2xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-sm">Deactivate Staff Account?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to remove access for staff member <span className="font-bold text-slate-700 dark:text-slate-200">"{deletingEmployee.name}"</span>?
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button onClick={() => setDeletingEmployee(null)} className="btn-secondary py-2 flex-1 rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleDeleteEmployee} className="bg-red-500 hover:bg-red-600 text-white py-2 flex-1 rounded-xl font-bold">
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployees;
