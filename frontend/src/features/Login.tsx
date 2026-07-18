import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { authStart, authSuccess, authFailure } from '../store/authSlice';
import api from '../services/api';
import { Smartphone, Mail, Lock, LogIn } from 'lucide-react';
import { useToast } from '../utils/ToastContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const toast = useToast();

  // Detect what the user is typing — phone or email
  const isPhone = /^\d+$/.test(emailOrPhone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    dispatch(authStart());

    try {
      const res = await api.post('/auth/login', { emailOrPhone, password });
      if (res.data?.data) {
        const { user, accessToken, refreshToken } = res.data.data;
        dispatch(authSuccess({ user, token: accessToken, refreshToken }));
        toast.success('Welcome back!', `Logged in as ${user.name}`);
        navigate('/');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Invalid credentials. Please try again.';
      setLoginError(errMsg);
      dispatch(authFailure(errMsg));
      toast.error('Login Failed', errMsg);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 p-8 glass-card space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Login to Your Account</h2>
        <p className="text-xs text-slate-400">Sign in using your email address or registered mobile number.</p>
      </div>

      {(error || loginError) && (
        <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-[11px] leading-relaxed text-center font-semibold">
          {loginError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1">
          <span className="flex items-center gap-1 text-slate-400">
            {isPhone ? <Smartphone size={12} /> : <Mail size={12} />}
            Email or Mobile Number
          </span>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="name@company.com or 9876543210"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="input-field py-2.5 text-xs pr-16"
              autoComplete="username"
            />
            {emailOrPhone && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isPhone ? 'bg-green-500/10 text-green-500' : 'bg-accent-blue/10 text-accent-blue'}`}>
                {isPhone ? 'Phone' : 'Email'}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <span className="flex items-center gap-1 text-slate-400"><Lock size={12} /> Password</span>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field py-2.5 text-xs"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <LogIn size={14} /> Sign In
            </>
          )}
        </button>
      </form>

      <div className="text-center text-[11px] text-slate-400">
        Don't have an account? <Link to="/register" className="text-accent-blue font-bold hover:underline">Register here</Link>
      </div>
    </div>
  );
};

export default Login;
