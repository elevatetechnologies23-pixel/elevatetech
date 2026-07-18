import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { authStart, authSuccess, authFailure } from '../../store/authSlice';
import api from '../../services/api';
import { ShieldAlert, Lock, Mail, LogIn } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    dispatch(authStart());

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.data) {
        const { user, accessToken, refreshToken } = res.data.data;

        // Enforce role check
        if (user.role !== 'admin') {
          const roleError = 'Access Denied: This portal is strictly restricted to system administrators.';
          setLoginError(roleError);
          dispatch(authFailure(roleError));
          return;
        }

        dispatch(authSuccess({ user, token: accessToken, refreshToken }));
        navigate('/admin');
      }
    } catch (err: any) {
      const errMsg = err.message || err.response?.data?.message || 'Invalid administrator credentials.';
      setLoginError(errMsg);
      dispatch(authFailure(errMsg));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full glass-card p-8 space-y-6 bg-primary-800/80 border-primary-500/25 relative overflow-hidden">

        {/* Top visual indicator */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500"></div>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-2">
            <ShieldAlert size={26} />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white">Administrator Secure Portal</h2>
          <p className="text-[11px] text-slate-400">Authorized personnel only. All access attempts are logged and monitored.</p>
        </div>

        {(error || loginError) && (
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] leading-relaxed text-center font-bold">
            {loginError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-300">
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"><Mail size={10} /> Admin Email</span>
            <input
              type="email" required placeholder="admin@evaluate.tech"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/40 border border-primary-500/20 text-white rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-colors text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"><Lock size={10} /> Security Key</span>
            <input
              type="password" required placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/40 border border-primary-500/20 text-white rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-colors text-xs font-medium"
            />
          </div>

          <button
            type="submit" disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-red-950/20"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={14} /> Authenticate Admin
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[10px] text-slate-500 space-y-1">
          <p>Don't have an admin account? <Link to="/admin/register" className="text-red-500 font-bold hover:underline">Register here</Link></p>
          <p><Link to="/login" className="hover:underline hover:text-slate-400">Back to Public Site</Link></p>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
