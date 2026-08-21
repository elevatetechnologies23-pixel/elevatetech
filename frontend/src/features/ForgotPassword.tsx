import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Smartphone, ArrowLeft, KeyRound, Lock, ShieldCheck, RefreshCw, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../utils/ToastContext';
import Logo from '../components/Logo';

type Step = 'input' | 'otp' | 'done';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState<Step>('input');
  const [identifier, setIdentifier] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Detect if identifier entered is a mobile number
  const isPhone = /^[0-9]+$/.test(identifier.trim());

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus first OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // --- Step 1: Request OTP ---
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError('Please enter your email address or mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', {
        emailOrPhone: cleanIdentifier,
        email: cleanIdentifier
      });

      const data = res.data?.data || {};
      setRegisteredEmail(data.email || cleanIdentifier);
      setMaskedEmail(data.maskedEmail || data.email || cleanIdentifier);

      toast.success(
        'OTP Sent!',
        `A 6-digit reset code has been sent to ${data.maskedEmail || 'your email'}.`
      );
      setStep('otp');
      setResendCooldown(60); // 60s cooldown
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unable to find an account with those details. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- OTP single digit input handler ---
  const handleOtpChange = (index: number, value: string) => {
    const lastChar = value.slice(-1);
    if (value && !/^\d$/.test(lastChar)) return;

    const updated = [...otp];
    updated[index] = lastChar;
    setOtp(updated);

    // Auto-advance to next input
    if (lastChar && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // --- OTP paste handler: supports full 6-digit paste into any box ---
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    if (digits.length === 0) return;

    const updated = [...otp];
    digits.forEach((digit, i) => {
      if (i < 6) updated[i] = digit;
    });
    setOtp(updated);

    // Focus the box following the last pasted digit or the last box
    const focusIndex = Math.min(digits.length, 5);
    otpInputsRef.current[focusIndex]?.focus();
  };

  // --- OTP keyboard navigation (backspace & arrow keys) ---
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const updated = [...otp];
        updated[index - 1] = '';
        setOtp(updated);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const updated = [...otp];
        updated[index] = '';
        setOtp(updated);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // --- Step 2: Verify OTP + Reset Password ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-check.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: registeredEmail || identifier.trim().toLowerCase(),
        emailOrPhone: identifier.trim(),
        otp: otpCode,
        newPassword
      });
      toast.success('Password Reset Successful!', 'You can now sign in with your new password.');
      setStep('done');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP. Please request a new code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Resend OTP handler ---
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', {
        emailOrPhone: identifier.trim(),
        email: registeredEmail || identifier.trim()
      });
      const data = res.data?.data || {};
      toast.success('OTP Resent!', `A fresh OTP was sent to ${data.maskedEmail || maskedEmail || 'your email'}.`);
      setOtp(['', '', '', '', '', '']);
      setResendCooldown(60);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not resend OTP. Please try again.';
      toast.error('Resend Failed', msg);
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

          {/* ===== STEP 1: EMAIL / PHONE INPUT ===== */}
          {step === 'input' && (
            <>
              <div className="space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 flex items-center justify-center mx-auto">
                  <KeyRound size={22} className="text-accent-blue" />
                </div>
                <h2 className="text-xl font-bold tracking-tight mt-3">Forgot your password?</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered email address or mobile number and we'll send you a 6-digit OTP to reset your password.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-[11px] font-semibold text-center leading-relaxed">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestOTP} className="space-y-4 text-xs text-left">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    {isPhone ? <Smartphone size={12} /> : <Mail size={12} />}
                    Registered Email or Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="name@company.com or 9876543210"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="input-field py-3 text-xs pr-16"
                      autoComplete="username"
                    />
                    {identifier && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isPhone ? 'bg-green-500/10 text-green-500' : 'bg-accent-blue/10 text-accent-blue'}`}>
                        {isPhone ? 'Phone' : 'Email'}
                      </span>
                    )}
                  </div>
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
                  A 6-digit OTP was sent to{' '}
                  <span className="font-bold text-accent-blue">{maskedEmail || registeredEmail || identifier}</span>.
                  Enter the code below along with your new password.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl text-[11px] font-semibold text-center leading-relaxed">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5 text-xs text-left">
                {/* OTP Input Boxes with Paste Support */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-slate-400 font-semibold">6-Digit OTP Code</label>
                    <span className="text-[10px] text-slate-400">Paste code supported</span>
                  </div>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpInputsRef.current[i] = el; }}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onPaste={handleOtpPaste}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={`w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all bg-slate-50 dark:bg-primary-800 ${
                          digit
                            ? 'border-accent-blue text-accent-blue shadow-sm shadow-accent-blue/10'
                            : 'border-slate-200 dark:border-primary-500 text-slate-700 dark:text-slate-200'
                        } focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20`}
                      />
                    ))}
                  </div>
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={isLoading || resendCooldown > 0}
                      className={`text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors ${
                        resendCooldown > 0
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-accent-blue hover:underline cursor-pointer'
                      }`}
                    >
                      <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
                      {resendCooldown > 0
                        ? `Resend OTP in ${resendCooldown}s`
                        : 'Resend OTP'}
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
                    onClick={() => { setStep('input'); setError(''); setOtp(['','','','','','']); }}
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
