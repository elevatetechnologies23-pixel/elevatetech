import React, { useState } from 'react';
import { X, Calendar, Clock, Video, CheckCircle, Sparkles, Phone, Mail, Building } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../utils/ToastContext';

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProductInterest?: string;
}

const BookDemoModal: React.FC<BookDemoModalProps> = ({ isOpen, onClose, defaultProductInterest = 'POS Billing Software' }) => {
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [productInterest, setProductInterest] = useState(defaultProductInterest);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('11:00 AM');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !preferredDate) {
      toast.error('Validation Error', 'Please complete all required contact and date fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/demos/book', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        companyName: companyName.trim(),
        productInterest,
        preferredDate,
        preferredTime,
        notes: notes.trim()
      });

      if (res.data?.status === 'success') {
        setIsSuccess(true);
        toast.success('Demo Requested!', 'Our specialist will contact you with the meeting link.');
      }
    } catch (err: any) {
      toast.error('Booking Error', err.response?.data?.message || 'Failed to submit demo request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompanyName('');
    setNotes('');
    setIsSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card max-w-lg w-full p-6 sm:p-8 space-y-6 bg-white dark:bg-primary-700 rounded-3xl shadow-2xl border border-slate-100 dark:border-primary-500/30 text-xs text-left relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={() => { resetForm(); onClose(); }}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-primary-600"
        >
          <X size={16} />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
              <CheckCircle size={36} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Live Demo Requested!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Thank you <strong>{name}</strong>! An Elevate technology specialist has received your booking request for <strong>{preferredDate} ({preferredTime})</strong>.
            </p>

            <div className="p-4 bg-slate-50 dark:bg-primary-800 rounded-2xl text-[11px] text-slate-500 text-left space-y-1">
              <div><strong>Selected Product:</strong> {productInterest}</div>
              <div><strong>Company:</strong> {companyName || 'Corporate Client'}</div>
              <div><strong>Contact Phone:</strong> {phone}</div>
            </div>

            <button
              onClick={() => { resetForm(); onClose(); }}
              className="btn-primary py-2.5 px-6 rounded-xl font-bold text-xs"
            >
              Done &amp; Close Window
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-1 border-b border-slate-100 dark:border-primary-500 pb-3">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-accent-blue bg-accent-blue/10 px-2.5 py-0.5 rounded-full inline-block mb-1">
                1-on-1 Virtual Session
              </span>
              <h3 className="text-xl font-extrabold flex items-center gap-2">
                <Video size={20} className="text-accent-blue" /> Schedule Live 1-on-1 Product Demo
              </h3>
              <p className="text-xs text-slate-400">Book a personalized video demonstration with an Elevate technical engineer for POS billing or CCTV setups.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Your Full Name *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Business Email *</span>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Phone Number *</span>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9922567375"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Company / Store Name</span>
                  <input
                    type="text"
                    placeholder="e.g. K-Retail Chains"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="input-field py-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Product Line Interest</span>
                <select
                  value={productInterest}
                  onChange={(e) => setProductInterest(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                >
                  <option value="POS Billing Software">POS &amp; GST Billing Software</option>
                  <option value="CCTV Camera Surveillance">CCTV Camera Surveillance Systems</option>
                  <option value="Enterprise Laptops & Workstations">Enterprise Laptops &amp; Workstations</option>
                  <option value="Cisco Networking & Rack Servers">Cisco Networking &amp; Rack Servers</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Preferred Date *</span>
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="input-field py-2 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-300">Preferred Time Window *</span>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                  >
                    <option value="10:00 AM">10:00 AM IST</option>
                    <option value="11:30 AM">11:30 AM IST</option>
                    <option value="02:00 PM">02:00 PM IST</option>
                    <option value="04:00 PM">04:00 PM IST</option>
                    <option value="06:00 PM">06:00 PM IST</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Specific Requirements or Counter Count</span>
                <textarea
                  rows={2}
                  placeholder="e.g., We have 3 retail counters and need thermal printer setup..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field py-2 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-3 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-accent-blue/30 text-xs"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Booking Appointment...
                  </span>
                ) : (
                  <>
                    <Calendar size={14} /> Confirm Demo Appointment
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default BookDemoModal;
