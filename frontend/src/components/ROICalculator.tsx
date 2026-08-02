import React, { useState } from 'react';
import { Calculator, Clock, TrendingUp, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROICalculator: React.FC = () => {
  const navigate = useNavigate();

  // Slider inputs
  const [dailyBills, setDailyBills] = useState<number>(120);
  const [avgBillValue, setAvgBillValue] = useState<number>(850);
  const [cashierCounters, setCashierCounters] = useState<number>(2);

  // Math calculations
  const monthlyTransactions = dailyBills * 30;
  const monthlyRevenue = monthlyTransactions * avgBillValue;
  
  // Approx 1.5 minutes saved per billing transaction via barcode scanning & auto GST print
  const monthlyHoursSaved = Math.round((monthlyTransactions * 1.5) / 60);

  // Approx 1.2% revenue loss prevented from pricing mistakes, stock leaks, and manual math errors
  const monthlySavings = Math.round(monthlyRevenue * 0.012);

  // ROI % calculation against standard POS license cost (~INR 4,999 one-time)
  const estimatedRoiPercent = Math.round((monthlySavings / 4999) * 100);

  return (
    <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200/60 dark:border-primary-500/30 space-y-8 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/20 dark:from-primary-800 dark:via-primary-700/80 dark:to-primary-900 text-left relative overflow-hidden shadow-xl">
      {/* Background Ambient Glow */}
      <div className="absolute -top-16 -right-16 w-60 h-60 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-primary-500/30 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-accent-blue/10 text-accent-blue text-xs font-extrabold px-3.5 py-1 rounded-full mb-2">
            <Calculator size={14} /> Interactive Business Calculator
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight">Calculate Your Business ROI &amp; Time Savings</h3>
          <p className="text-xs text-slate-400 mt-1">See how much time, labor cost, and billing shrinkage Elevate POS Software saves your store monthly.</p>
        </div>

        <button
          onClick={() => navigate('/billing-software')}
          className="btn-primary py-2.5 px-5 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-md shadow-accent-blue/20"
        >
          View Billing Software Plans <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Input Sliders Controls */}
        <div className="space-y-6">
          {/* Slider 1: Daily Bills */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200">Daily Customer Invoices / Bills</span>
              <span className="font-extrabold text-accent-blue text-sm bg-accent-blue/10 px-2.5 py-0.5 rounded-md font-mono">{dailyBills} Bills / Day</span>
            </div>
            <input
              type="range"
              min="20"
              max="800"
              step="10"
              value={dailyBills}
              onChange={(e) => setDailyBills(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-primary-600 rounded-lg appearance-none cursor-pointer accent-accent-blue"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>20 bills</span>
              <span>400 bills</span>
              <span>800+ bills</span>
            </div>
          </div>

          {/* Slider 2: Average Bill Value */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200">Average Bill Amount (INR)</span>
              <span className="font-extrabold text-accent-gold text-sm bg-accent-gold/10 px-2.5 py-0.5 rounded-md font-mono">INR {avgBillValue.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="50"
              value={avgBillValue}
              onChange={(e) => setAvgBillValue(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-primary-600 rounded-lg appearance-none cursor-pointer accent-accent-gold"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>INR 100</span>
              <span>INR 2,500</span>
              <span>INR 5,000+</span>
            </div>
          </div>

          {/* Slider 3: Cashier Counters */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200">Number of Cashier Counters</span>
              <span className="font-extrabold text-green-500 text-sm bg-green-500/10 px-2.5 py-0.5 rounded-md font-mono">{cashierCounters} Counter{cashierCounters > 1 ? 's' : ''}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={cashierCounters}
              onChange={(e) => setCashierCounters(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-primary-600 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1 Counter</span>
              <span>5 Counters</span>
              <span>10 Counters</span>
            </div>
          </div>
        </div>

        {/* Calculated Results Display */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-primary-700 border border-slate-200/60 dark:border-primary-500/30 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-accent-blue flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Monthly Time Saved</span>
              <span className="text-xl font-black text-primary-500 dark:text-primary-50">{monthlyHoursSaved} Hours / Month</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Barcode scanning &amp; instant printer speed</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-primary-700 border border-slate-200/60 dark:border-primary-500/30 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Estimated Monthly Savings</span>
              <span className="text-xl font-black text-green-500">INR {monthlySavings.toLocaleString('en-IN')} / Mo</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Prevented price leaks &amp; math errors</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-primary-600 text-white flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-accent-gold/20 text-accent-gold flex items-center justify-center shrink-0 border border-accent-gold/30">
              <Sparkles size={24} />
            </div>
            <div>
              <span className="text-[11px] text-slate-300 font-medium block">Estimated First-Month ROI</span>
              <span className="text-2xl font-black text-accent-gold">{estimatedRoiPercent}% Return</span>
              <p className="text-[10px] text-slate-300 mt-0.5">Pays for software license within 12 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;
