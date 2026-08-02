import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, Lock, ShieldCheck, RefreshCw, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../utils/ToastContext';
import Logo from '../components/Logo';

type Step = 'email' | 'otp' | 'done';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Step 1: Request OTP ---
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      toast.success('OTP Sent!', `Check your inbox at ${email} for the 6-digit reset code.`);
      setStep('otp');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- OTP input: auto-advance on digit entry ---
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // --- Step 2: Verify OTP + Reset Password ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otpCode = otp.join('');
    if (otpCode.length < 6) { setError('Please enter the complete 6-digit OTP.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim().toLowerCase(), otp: otpCode, newPassword });
      toast.success('Password Reset!', 'Your password has been updated. Please log in.');
      setStep('done');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      toast.success('OTP Resent', 'A fresh OTP has been sent to your email.');
      setOtp(['', '', '', '', '', '']);
    } catch {
      toast.error('Failed', 'Could not resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 animate-fade-in">

        {/* Card */}
        <div className="glass-card p-8 space-y-6 text-center relative overflow-hidden">

          {/* Decorative background blobs */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-accent-blue/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />

          {/* Logo */}
          <div className="flex justify-center">
            <Logo size="lg" showTagline={false} />
          </div>

          {/* ===== STEP 1: EMAIL ===== */}
          {step === 'email' && (
            <>
              <div className="space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 flex items-center justify-center mx-auto">
                  <KeyRound size={22} className="text-accent-blue" />
                </div>
                <h2 className="text-xl font-bold tracking-tight mt-3">Forgot your password?</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered email address and we'll send you a 6-digit OTP to reset your password.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-[11px] font-semibold text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestOTP} className="space-y-4 text-xs text-left">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Mail size={12} /> Registered Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field py-3 text-xs"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  {isLoading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending OTP...</>
                    : <><Mail size={14} /> Send Reset OTP</>
                  }
                </button>
              </form>
            </>
          )}

          {/* ===== STEP 2: OTP + NEW PASSWORD ===== */}
          {step === 'otp' && (
            <>
              <div className="space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
                  <ShieldCheck size={22} className="text-green-500" />
                </div>
                <h2 className="text-xl font-bold tracking-tight mt-3">Enter OTP & New Password</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A 6-digit OTP was sent to <span className="font-bold text-accent-blue">{email}</span>. Enter it below along with your new password.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-[11px] font-semibold text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5 text-xs text-left">
                {/* OTP Input Boxes */}
                <div className="space-y-2">
                  <label className="text-slate-400 font-semibold block text-center">6-Digit OTP Code</label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={`w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all bg-slate-50 dark:bg-primary-800 ${
                          digit
                            ? 'border-accent-blue text-accent-blue'
                            : 'border-slate-200 dark:border-primary-500 text-slate-700 dark:text-slate-200'
                        } focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20`}
                      />
                    ))}
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={isLoading}
                      className="text-[10px] text-accent-blue hover:underline font-semibold flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw size={10} /> Resend OTP
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Lock size={12} /> New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field py-3 text-xs pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Lock size={12} /> Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`input-field py-3 text-xs pr-10 ${
                        confirmPassword && newPassword !== confirmPassword ? 'border-red-400' : ''
                      }`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[10px] text-red-500 font-semibold">Passwords do not match</p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setError(''); setOtp(['','','','','','']); }}
                    className="btn-secondary py-3 flex-1 rounded-xl font-bold flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={13} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary py-3 flex-1 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    {isLoading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting...</>
                      : <><ShieldCheck size={14} /> Reset Password</>
                    }
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ===== STEP 3: SUCCESS ===== */}
          {step === 'done' && (
            <div className="space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-green-600">Password Reset!</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your password has been successfully updated. You can now log in with your new credentials.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full btn-primary py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              >
                <KeyRound size={14} /> Go to Login
              </button>
            </div>
          )}

        </div>

        {/* Footer link */}
        {step !== 'done' && (
          <div className="text-center text-[11px] text-slate-400">
            Remembered your password?{' '}
            <Link to="/login" className="text-accent-blue font-bold hover:underline">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
