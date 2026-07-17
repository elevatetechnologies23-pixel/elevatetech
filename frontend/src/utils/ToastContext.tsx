import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X, ShoppingCart } from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'cart';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  cart: (title: string, message?: string) => void;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// ─────────────────────────────────────────────
// Individual Toast Item
// ─────────────────────────────────────────────
const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
  cart: <ShoppingCart size={18} />,
};

const TOAST_STYLES: Record<ToastType, { bar: string; icon: string; border: string }> = {
  success: { bar: 'bg-green-500', icon: 'text-green-500', border: 'border-green-500/20' },
  error:   { bar: 'bg-red-500',   icon: 'text-red-400',   border: 'border-red-500/20' },
  warning: { bar: 'bg-orange-500', icon: 'text-orange-400', border: 'border-orange-500/20' },
  info:    { bar: 'bg-accent-blue', icon: 'text-accent-blue', border: 'border-accent-blue/20' },
  cart:    { bar: 'bg-accent-blue', icon: 'text-accent-blue', border: 'border-accent-blue/20' },
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const style = TOAST_STYLES[toast.type];
  const duration = toast.duration ?? 3500;

  return (
    <div
      className={`relative flex items-start gap-3 bg-white dark:bg-primary-700 border ${style.border} rounded-2xl shadow-lg shadow-black/10 px-4 py-3.5 min-w-[280px] max-w-[360px] overflow-hidden animate-toast-in`}
      role="alert"
    >
      {/* Colored left progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-1 ${style.bar} rounded-b-2xl animate-toast-bar`}
        style={{ animationDuration: `${duration}ms` }}
      />

      {/* Icon */}
      <div className={`shrink-0 mt-0.5 ${style.icon}`}>
        {TOAST_ICONS[toast.type]}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-primary-500 dark:text-primary-50 leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timerRefs.current[id]);
    delete timerRefs.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const playNotificationSound = useCallback((type: ToastType) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const context = new AudioCtx();
      const now = context.currentTime;

      const playTone = (
        freq: number,
        startTime: number,
        duration: number,
        toneType: OscillatorType = 'sine',
        volume = 0.08
      ) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);
        osc.type = toneType;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      if (type === 'success') {
        // High-quality rising chime
        playTone(523.25, now, 0.25); // C5
        playTone(659.25, now + 0.08, 0.25); // E5
        playTone(783.99, now + 0.16, 0.4); // G5
      } else if (type === 'error') {
        // Warning buzz tone
        playTone(330.00, now, 0.15, 'triangle', 0.12); // E4
        playTone(293.66, now + 0.12, 0.25, 'triangle', 0.12); // D4
      } else if (type === 'warning') {
        // Caution ping
        playTone(440.00, now, 0.25, 'triangle', 0.1); // A4
      } else if (type === 'cart') {
        // Happy coin sound
        playTone(987.77, now, 0.08); // B5
        playTone(1318.51, now + 0.06, 0.35); // E6
      } else {
        // Info/Default notification sound
        playTone(587.33, now, 0.2); // D5
        playTone(880.00, now + 0.08, 0.35); // A5
      }
    } catch (e) {
      console.warn('Notification audio playback failed:', e);
    }
  }, []);

  const showToast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const duration = options.duration ?? 3500;

    setToasts(prev => {
      // Cap at 4 toasts max — remove oldest if exceeded
      const trimmed = prev.length >= 4 ? prev.slice(1) : prev;
      return [...trimmed, { ...options, id, duration }];
    });

    playNotificationSound(options.type);

    timerRefs.current[id] = setTimeout(() => dismiss(id), duration);
  }, [dismiss, playNotificationSound]);

  const success = useCallback((title: string, message?: string) =>
    showToast({ type: 'success', title, message }), [showToast]);

  const error = useCallback((title: string, message?: string) =>
    showToast({ type: 'error', title, message, duration: 5000 }), [showToast]);

  const warning = useCallback((title: string, message?: string) =>
    showToast({ type: 'warning', title, message }), [showToast]);

  const info = useCallback((title: string, message?: string) =>
    showToast({ type: 'info', title, message }), [showToast]);

  const cart = useCallback((title: string, message?: string) =>
    showToast({ type: 'cart', title, message }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, cart }}>
      {children}

      {/* Toast Container — fixed bottom-right */}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 items-end"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
