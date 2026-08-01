import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { authStart, authSuccess, authFailure } from '../../store/authSlice';
import api from '../../services/api';
import { Briefcase, User, Mail, Lock, UserPlus } from 'lucide-react';
import Logo from '../../components/Logo';

const EmployeeRegister: React.FC = () => {
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
        role: 'employee'
      });
      if (res.data?.data) {
        const { user, accessToken, refreshToken } = res.data.data;
        dispatch(authSuccess({ user, token: accessToken, refreshToken }));
        navigate('/employee');
      }
    } catch (err: any) {
      const errMsg = err.message || err.response?.data?.message || 'Staff registration failed. Please try again.';
      setRegisterError(errMsg);
      dispatch(authFailure(errMsg));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full glass-card p-8 space-y-6 bg-primary-800/80 border-primary-500/25 relative overflow-hidden">

        {/* Top visual indicator */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent-gold to-yellow-500"></div>

        <div className="text-center space-y-3">
          <div className="flex justify-center pb-1">
            <Logo size="lg" lightOnly={true} />
          </div>
          <div className="w-10 h-10 rounded-2xl bg-accent-gold/10 text-accent-gold flex items-center justify-center mx-auto">
            <Briefcase size={22} />
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-white">Create Staff Account</h2>
          <p className="text-[11px] text-slate-400">Register a new employee credential to access catalog and helpdesk queues.</p>
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
              type="text" required placeholder="Jane Smith"
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950/40 border border-primary-500/20 text-white rounded-xl px-4 py-3 outline-none focus:border-accent-gold/50 transition-colors text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"><Mail size={10} /> Staff Email</span>
            <input
              type="email" required placeholder="staff@evaluate.tech"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/40 border border-primary-500/20 text-white rounded-xl px-4 py-3 outline-none focus:border-accent-gold/50 transition-colors text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"><Lock size={10} /> Password</span>
            <input
              type="password" required placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/40 border border-primary-500/20 text-white rounded-xl px-4 py-3 outline-none focus:border-accent-gold/50 transition-colors text-xs font-medium"
            />
          </div>

          <button
            type="submit" disabled={isLoading}
            className="w-full bg-gradient-to-r from-accent-gold to-yellow-500 hover:from-yellow-500 hover:to-accent-gold text-slate-950 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-yellow-950/20"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus size={14} /> Register Staff
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[10px] text-slate-500">
          Already have an account? <Link to="/secure/portal/staff-auth-1z56" className="text-accent-gold font-bold hover:underline">Sign In here</Link>
        </div>

      </div>
    </div>
  );
};

export default EmployeeRegister;
