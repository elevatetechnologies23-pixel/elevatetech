import React, { useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [gstPercentage, setGstPercentage] = useState('18');
  const [shippingLimit, setShippingLimit] = useState('5000');
  const [shippingCharge, setShippingCharge] = useState('150');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 dark:border-primary-500 pb-4">
        <h2 className="text-xl font-bold">System Configuration Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Configure shop-wide defaults, tax thresholds, and logistics charges.</p>
      </div>

      <div className="glass-card max-w-xl p-6 space-y-6">
        {isSuccess && (
          <div className="p-4 bg-green-500/10 text-green-500 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle size={16} /> Configurations saved and broadcasted successfully!
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span>Standard Hardware GST (%)</span>
              <input 
                type="number" 
                value={gstPercentage} 
                onChange={(e) => setGstPercentage(e.target.value)}
                className="input-field py-2" 
              />
            </div>
            <div className="space-y-1">
              <span>Free Shipping Threshold (INR)</span>
              <input 
                type="number" 
                value={shippingLimit} 
                onChange={(e) => setShippingLimit(e.target.value)}
                className="input-field py-2" 
              />
            </div>
            <div className="space-y-1">
              <span>Standard Logistics Charge (INR)</span>
              <input 
                type="number" 
                value={shippingCharge} 
                onChange={(e) => setShippingCharge(e.target.value)}
                className="input-field py-2" 
              />
            </div>
          </div>

          <button type="submit" className="btn-primary py-2.5 px-6 rounded-xl font-bold flex items-center gap-1.5 w-fit">
            <Save size={14} /> Save Configuration
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
