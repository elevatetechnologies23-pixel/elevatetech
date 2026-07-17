import React, { useState } from 'react';
import { 
  Building2, 
  Send, 
  Calculator, 
  Percent, 
  CheckCircle
} from 'lucide-react';

const CorporateEnquiry: React.FC = () => {
  // Enquiry state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [requirements, setRequirements] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // EMI Calculator states
  const [emiPrincipal, setEmiPrincipal] = useState('100000');
  const [emiRate, setEmiRate] = useState('12');
  const [emiTenure, setEmiTenure] = useState('12');
  const [emiResult, setEmiResult] = useState<number | null>(100000 * (12/1200) * Math.pow(1 + 12/1200, 12) / (Math.pow(1 + 12/1200, 12) - 1)); // default calc

  // GST Calculator states
  const [gstAmount, setGstAmount] = useState('10000');
  const [gstRate, setGstRate] = useState('18');
  const [gstType, setGstType] = useState<'exclusive' | 'inclusive'>('exclusive');

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Mock submit log
    console.log('Corporate Enquiry submitted:', { name, email, phone, company, requirements });
  };

  const calculateEMI = (e: React.FormEvent) => {
    e.preventDefault();
    const P = Number(emiPrincipal);
    const r = Number(emiRate) / 12 / 100; // monthly rate
    const n = Number(emiTenure); // months

    if (P > 0 && r > 0 && n > 0) {
      const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setEmiResult(Math.round(emi));
    } else {
      setEmiResult(null);
    }
  };

  // Compute GST details
  const gstDetails = (() => {
    const amt = Number(gstAmount) || 0;
    const rate = Number(gstRate) || 0;
    let base = 0;
    let tax = 0;
    let total = 0;

    if (gstType === 'exclusive') {
      base = amt;
      tax = amt * (rate / 100);
      total = amt + tax;
    } else {
      total = amt;
      base = amt / (1 + rate / 100);
      tax = total - base;
    }

    return {
      basePrice: Math.round(base),
      gstTax: Math.round(tax),
      totalPrice: Math.round(total)
    };
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Corporate Procurement & Support</h1>
        <p className="text-sm text-slate-400">Custom B2B quotations, volume discounts, GST tax invoicing, and financing options for your enterprise.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Bulk Enquiry Form */}
        <div className="lg:col-span-2 glass-card p-6 space-y-6">
          <h2 className="font-bold text-base flex items-center gap-2 border-b border-slate-100 dark:border-primary-500 pb-2">
            <Building2 className="text-accent-blue" size={20} /> Request Corporate Quotation
          </h2>

          {submitted ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
                <CheckCircle size={24} />
              </div>
              <h3 className="font-bold text-sm">Enquiry Submitted Successfully!</h3>
              <p className="text-xs text-slate-400">Our B2B corporate relations team will get back to you with custom pricing details within 4 hours.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Send Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnquirySubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span>Contact Name</span>
                <input 
                  type="text" 
                  required
                  placeholder="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field py-2"
                />
              </div>
              <div className="space-y-1">
                <span>Work Email</span>
                <input 
                  type="email" 
                  required
                  placeholder="corporate@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field py-2"
                />
              </div>
              <div className="space-y-1">
                <span>Phone Number</span>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field py-2"
                />
              </div>
              <div className="space-y-1">
                <span>Company Name</span>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Alpha Solutions Pvt Ltd"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="input-field py-2"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <span>Hardware / Software Procurement Requirements</span>
                <textarea 
                  required
                  placeholder="Specify model numbers, quantity requirements, or support contract terms..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={4}
                  className="input-field py-2 resize-none"
                />
              </div>
              <button type="submit" className="col-span-2 btn-primary py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 mt-2">
                <Send size={14} /> Submit Request for Quote (RFQ)
              </button>
            </form>
          )}
        </div>

        {/* Financial Calculators Widgets */}
        <div className="space-y-6">
          
          {/* EMI Calculator */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-bold text-xs flex items-center gap-1.5 border-b border-slate-100 dark:border-primary-500 pb-2">
              <Calculator size={16} className="text-accent-gold" /> Financing EMI Calculator
            </h2>
            <form onSubmit={calculateEMI} className="space-y-3 text-xs">
              <div className="space-y-1">
                <span>Principal Amount (INR)</span>
                <input 
                  type="number" 
                  value={emiPrincipal}
                  onChange={(e) => setEmiPrincipal(e.target.value)}
                  className="input-field py-1 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span>Interest Rate (%)</span>
                  <input 
                    type="number" 
                    step="0.1"
                    value={emiRate}
                    onChange={(e) => setEmiRate(e.target.value)}
                    className="input-field py-1 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span>Tenure (Months)</span>
                  <input 
                    type="number" 
                    value={emiTenure}
                    onChange={(e) => setEmiTenure(e.target.value)}
                    className="input-field py-1 text-xs"
                  />
                </div>
              </div>
              <button type="submit" className="w-full btn-secondary py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-primary-500">
                Calculate EMI
              </button>
              
              {emiResult !== null && (
                <div className="p-3 bg-accent-gold/10 text-accent-gold rounded-xl text-center space-y-1">
                  <span className="text-[10px] block font-medium">Estimated Monthly Installment</span>
                  <span className="font-extrabold text-sm">INR {emiResult.toLocaleString('en-IN')} / Mo</span>
                </div>
              )}
            </form>
          </div>

          {/* GST Calculator */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-bold text-xs flex items-center gap-1.5 border-b border-slate-100 dark:border-primary-500 pb-2">
              <Percent size={16} className="text-accent-blue" /> GST Tax Split Calculator
            </h2>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <span>Amount (INR)</span>
                <input 
                  type="number" 
                  value={gstAmount}
                  onChange={(e) => setGstAmount(e.target.value)}
                  className="input-field py-1 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span>GST Tax Rate (%)</span>
                  <select 
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-primary-600 rounded text-xs outline-none border-none font-medium"
                  >
                    <option value="18">18% (Electronics)</option>
                    <option value="12">12% (Services)</option>
                    <option value="28">28% (Luxury)</option>
                    <option value="5">5% (Essential)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span>Calculation Type</span>
                  <select 
                    value={gstType}
                    onChange={(e) => setGstType(e.target.value as 'exclusive' | 'inclusive')}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-primary-600 rounded text-xs outline-none border-none font-medium"
                  >
                    <option value="exclusive">GST Exclusive</option>
                    <option value="inclusive">GST Inclusive</option>
                  </select>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-primary-700/50 rounded-xl space-y-1.5 text-[10px]">
                <div className="flex justify-between">
                  <span>Base Price (Net of Tax):</span>
                  <span className="font-semibold">INR {gstDetails.basePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Component Amount:</span>
                  <span className="font-semibold text-accent-blue">+INR {gstDetails.gstTax.toLocaleString('en-IN')}</span>
                </div>
                <hr className="border-slate-200 dark:border-primary-500 my-1" />
                <div className="flex justify-between font-bold text-xs pt-0.5">
                  <span>Final Total Price:</span>
                  <span>INR {gstDetails.totalPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CorporateEnquiry;
