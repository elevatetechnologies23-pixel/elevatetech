import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useSettings } from '../../utils/SettingsContext';
import { useToast } from '../../utils/ToastContext';

const AdminSettings: React.FC = () => {
  const { settings, reloadSettings } = useSettings();
  const toast = useToast();

  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [heroBannerTitle, setHeroBannerTitle] = useState('');
  const [heroBannerSubtitle, setHeroBannerSubtitle] = useState('');
  const [gstPercentage, setGstPercentage] = useState('18');
  const [shippingLimit, setShippingLimit] = useState('5000');
  const [shippingCharge, setShippingCharge] = useState('150');

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize states with values from dynamic context settings
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || '');
      setCompanyEmail(settings.companyEmail || '');
      setCompanyPhone(settings.companyPhone || '');
      setCompanyAddress(settings.companyAddress || '');
      setLogoUrl(settings.logoUrl || '');
      setHeroBannerTitle(settings.heroBannerTitle || '');
      setHeroBannerSubtitle(settings.heroBannerSubtitle || '');
      setGstPercentage(settings.gstPercentage || '18');
      setShippingLimit(settings.shippingLimit || '5000');
      setShippingCharge(settings.shippingCharge || '150');
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSuccess(false);

    const settingsArray = [
      { key: 'companyName', value: companyName },
      { key: 'companyEmail', value: companyEmail },
      { key: 'companyPhone', value: companyPhone },
      { key: 'companyAddress', value: companyAddress },
      { key: 'logoUrl', value: logoUrl },
      { key: 'heroBannerTitle', value: heroBannerTitle },
      { key: 'heroBannerSubtitle', value: heroBannerSubtitle },
      { key: 'gstPercentage', value: gstPercentage },
      { key: 'shippingLimit', value: shippingLimit },
      { key: 'shippingCharge', value: shippingCharge },
    ];

    try {
      await api.post('/admin/settings', { settingsArray });
      await reloadSettings(); // Refresh branding settings globally in context
      setIsSuccess(true);
      toast.success('Settings Saved', 'System configurations have been updated and broadcasted.');
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (err: any) {
      toast.error('Save Failed', err.response?.data?.message || err.message || 'Could not save configurations.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 dark:border-primary-500 pb-4">
        <h2 className="text-xl font-bold">System Configuration Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Configure dynamic branding, contact details, landing hero text, tax rates, and logistics.</p>
      </div>

      <div className="glass-card max-w-3xl p-6 space-y-6 bg-white dark:bg-primary-700">
        {isSuccess && (
          <div className="p-4 bg-green-500/10 text-green-500 rounded-xl text-xs font-semibold flex items-center gap-2 border border-green-500/20">
            <CheckCircle size={16} /> Configurations saved and broadcasted globally!
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6 text-xs text-left">
          {/* Section 1: Branding Information */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-accent-blue border-b border-slate-100 dark:border-primary-500/30 pb-1">Shop Branding & Contacts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="font-semibold">Company Display Name</span>
                <input 
                  type="text" required
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Logo Image URL (Leave blank for standard text logo)</span>
                <input 
                  type="text"
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="input-field py-2" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Support Contact Phone</span>
                <input 
                  type="text" required
                  value={companyPhone} 
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Support Contact Email</span>
                <input 
                  type="email" required
                  value={companyEmail} 
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
              <div className="col-span-2 space-y-1">
                <span className="font-semibold">Corporate Office Address</span>
                <input 
                  type="text" required
                  value={companyAddress} 
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Banner text */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-accent-blue border-b border-slate-100 dark:border-primary-500/30 pb-1">Landing Banners</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <span className="font-semibold">Homepage Hero Title</span>
                <input 
                  type="text" required
                  value={heroBannerTitle} 
                  onChange={(e) => setHeroBannerTitle(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Homepage Hero Subtitle</span>
                <textarea 
                  required rows={2}
                  value={heroBannerSubtitle} 
                  onChange={(e) => setHeroBannerSubtitle(e.target.value)}
                  className="input-field py-2 resize-none" 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Tax & Logistics */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-accent-blue border-b border-slate-100 dark:border-primary-500/30 pb-1">Tax & Logistics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="font-semibold">Hardware GST Rate (%)</span>
                <input 
                  type="number" required min="0" max="100"
                  value={gstPercentage} 
                  onChange={(e) => setGstPercentage(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Free Shipping Limit (INR)</span>
                <input 
                  type="number" required min="0"
                  value={shippingLimit} 
                  onChange={(e) => setShippingLimit(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Delivery Charge (INR)</span>
                <input 
                  type="number" required min="0"
                  value={shippingCharge} 
                  onChange={(e) => setShippingCharge(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="btn-primary py-2.5 px-6 rounded-xl font-bold flex items-center gap-1.5 w-fit disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={14} /> Save Configuration
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
