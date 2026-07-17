import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw } from 'lucide-react';

const AdminEmployees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/employees');
      if (res.data?.data) {
        setEmployees(res.data.data);
      }
    } catch {
      console.warn('API error, using offline employee list');
      setEmployees([
        { id: 'emp-1', name: 'Administrator Chief', email: 'admin@test.com', role: 'admin' },
        { id: 'emp-2', name: 'Staff Clerk', email: 'employee@test.com', role: 'employee' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleUpdateRole = async (id: string, newRole: string) => {
    try {
      await api.put(`/admin/employees/${id}/role`, { role: newRole });
      loadEmployees();
    } catch {
      setEmployees(employees.map(e => e.id === id ? { ...e, role: newRole } : e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-primary-500 pb-4">
        <h2 className="text-xl font-bold">Staff & Access Permissions</h2>
        <button onClick={loadEmployees} className="btn-secondary text-xs font-semibold py-1.5 px-3 rounded-lg border flex items-center gap-1.5">
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
                <th className="px-6 py-4 font-bold text-slate-400">Employee Name</th>
                <th className="px-6 py-4 font-bold text-slate-400">Work Email</th>
                <th className="px-6 py-4 font-bold text-slate-400">Security Role</th>
                <th className="px-6 py-4 font-bold text-slate-400 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.email} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                  <td className="px-6 py-4 font-bold">{emp.name}</td>
                  <td className="px-6 py-4 font-mono">{emp.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${emp.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select 
                      value={emp.role} 
                      onChange={(e) => handleUpdateRole(emp.id || emp.email, e.target.value)}
                      className="px-2 py-1 bg-slate-50 dark:bg-primary-600 rounded text-[10px] outline-none border-none font-semibold"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                      <option value="customer">Demote to Customer</option>
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

export default AdminEmployees;
