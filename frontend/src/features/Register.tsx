import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { authStart, authSuccess } from '../store/authSlice';
import api from '../services/api';
import { User as UserIcon, Mail, Lock, Smartphone, UserPlus } from 'lucide-react';
import { useToast } from '../utils/ToastContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    // Validate phone if provided
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setRegisterError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    dispatch(authStart());
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        phone: phone || undefined,
        password
      });
      if (res.data?.data) {
        const { user, accessToken, refreshToken } = res.data.data;
        dispatch(authSuccess({ user, token: accessToken, refreshToken }));
        toast.success('Account Created!', `Welcome ${user.name}! You are now logged in.`);
        navigate('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your details.';
      setRegisterError(msg);
      toast.error('Registration Failed', msg);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 p-8 glass-card space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Create an Account</h2>
        <p className="text-xs text-slate-400">Join our platform as a retail buyer or corporate customer.</p>
      </div>

      {(error || registerError) && (
        <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-[11px] leading-relaxed text-center font-semibold">
          {registerError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1">
          <span className="flex items-center gap-1 text-slate-400"><UserIcon size={12} /> Contact Name</span>
          <input
            type="text"
            required
            placeholder="Your Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field py-2.5 text-xs"
          />
        </div>

        <div className="space-y-1">
          <span className="flex items-center gap-1 text-slate-400"><Mail size={12} /> Work Email</span>
          <input
            type="email"
            required
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field py-2.5 text-xs"
          />
        </div>

        <div className="space-y-1">
          <span className="flex items-center gap-1 text-slate-400">
            <Smartphone size={12} />
            Mobile Number <span className="text-[9px] ml-1 text-slate-300">(Optional — enables phone login)</span>
          </span>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs text-slate-400 font-semibold select-none">+91</span>
            <input
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="input-field py-2.5 text-xs pl-10"
              maxLength={10}
            />
          </div>
          {phone && phone.length === 10 && !/^[6-9]\d{9}$/.test(phone) && (
            <p className="text-red-400 text-[10px]">Enter a valid 10-digit Indian mobile number.</p>
          )}
        </div>

        <div className="space-y-1">
          <span className="flex items-center gap-1 text-slate-400"><Lock size={12} /> Password</span>
          <input
            type="password"
            required
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field py-2.5 text-xs"
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
              <UserPlus size={14} /> Register Account
            </>
          )}
        </button>
      </form>

      <div className="text-center text-[11px] text-slate-400">
        Already have an account? <Link to="/login" className="text-accent-blue font-bold hover:underline">Sign In here</Link>
      </div>
    </div>
  );
};

export default Register;
