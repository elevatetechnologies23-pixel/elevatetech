import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { authStart, authSuccess, authFailure } from '../../store/authSlice';
import api from '../../services/api';
import { ShieldAlert, User, Mail, Lock, UserPlus } from 'lucide-react';

const AdminRegister: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerError, setRegisterError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    dispatch(authStart());

    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        role: 'admin'
      });
      if (res.data?.data) {
        const { user, accessToken, refreshToken } = res.data.data;
        dispatch(authSuccess({ user, token: accessToken, refreshToken }));
        navigate('/admin');
      }
    } catch (err: any) {
      const errMsg = err.message || err.response?.data?.message || 'Admin registration failed. Please try again.';
      setRegisterError(errMsg);
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
          <h2 className="text-xl font-extrabold tracking-tight text-white">Create Admin Account</h2>
          <p className="text-[11px] text-slate-400">Register a new administrator credential with full root access.</p>
        </div>

        {(error || registerError) && (
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] leading-relaxed text-center font-bold">
            {registerError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-300">
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"><User size={10} /> Full Name</span>
            <input
              type="text" required placeholder="John Doe"
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950/40 border border-primary-500/20 text-white rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-colors text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"><Mail size={10} /> Admin Email</span>
            <input
              type="email" required placeholder="elevatetechnologies23@gmail.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/40 border border-primary-500/20 text-white rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition-colors text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"><Lock size={10} /> Security Password</span>
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
                <UserPlus size={14} /> Register Admin
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[10px] text-slate-500">
          Already have an account? <Link to="/admin/login" className="text-red-500 font-bold hover:underline">Sign In here</Link>
        </div>

      </div>
    </div>
  );
};

export default AdminRegister;
