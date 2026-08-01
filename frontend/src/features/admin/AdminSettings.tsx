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

  // Social Media Link states (Admin Managed)
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Support Chatbot states (Admin Managed)
  const [chatbotEnabled, setChatbotEnabled] = useState('true');
  const [chatbotWelcomeMessage, setChatbotWelcomeMessage] = useState('');

  // Billing Software Page Banner states (Admin Managed)
  const [billingSoftwareTitle, setBillingSoftwareTitle] = useState('');
  const [billingSoftwareSubtitle, setBillingSoftwareSubtitle] = useState('');
  const [billingSoftwareVersion, setBillingSoftwareVersion] = useState('');

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
      setFacebookUrl(settings.facebookUrl || '');
      setTwitterUrl(settings.twitterUrl || '');
      setInstagramUrl(settings.instagramUrl || '');
      setLinkedinUrl(settings.linkedinUrl || '');
      setYoutubeUrl(settings.youtubeUrl || '');
      setWhatsappNumber(settings.whatsappNumber || '');
      setChatbotEnabled(settings.chatbotEnabled || 'true');
      setChatbotWelcomeMessage(settings.chatbotWelcomeMessage || '');
      setBillingSoftwareTitle(settings.billingSoftwareTitle || '');
      setBillingSoftwareSubtitle(settings.billingSoftwareSubtitle || '');
      setBillingSoftwareVersion(settings.billingSoftwareVersion || '');
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
      { key: 'facebookUrl', value: facebookUrl },
      { key: 'twitterUrl', value: twitterUrl },
      { key: 'instagramUrl', value: instagramUrl },
      { key: 'linkedinUrl', value: linkedinUrl },
      { key: 'youtubeUrl', value: youtubeUrl },
      { key: 'whatsappNumber', value: whatsappNumber },
      { key: 'chatbotEnabled', value: chatbotEnabled },
      { key: 'chatbotWelcomeMessage', value: chatbotWelcomeMessage },
      { key: 'billingSoftwareTitle', value: billingSoftwareTitle },
      { key: 'billingSoftwareSubtitle', value: billingSoftwareSubtitle },
      { key: 'billingSoftwareVersion', value: billingSoftwareVersion },
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

          {/* Section 2.5: Billing Software Page Configurations */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-accent-blue border-b border-slate-100 dark:border-primary-500/30 pb-1">Billing Software Page Banner</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <span className="font-semibold">Billing Software Header Title</span>
                <input 
                  type="text" required
                  value={billingSoftwareTitle} 
                  onChange={(e) => setBillingSoftwareTitle(e.target.value)}
                  placeholder="Enterprise POS Billing Software"
                  className="input-field py-2" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Billing Software Subtitle</span>
                <textarea 
                  required rows={2}
                  value={billingSoftwareSubtitle} 
                  onChange={(e) => setBillingSoftwareSubtitle(e.target.value)}
                  placeholder="Offline-first desktop software for retail invoicing..."
                  className="input-field py-2 resize-none" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Software Release Version Tag</span>
                <input 
                  type="text" required
                  value={billingSoftwareVersion} 
                  onChange={(e) => setBillingSoftwareVersion(e.target.value)}
                  placeholder="v5.2.14-Windows"
                  className="input-field py-2" 
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

          {/* Section 4: Social Media Links (Admin Managed) */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-accent-blue border-b border-slate-100 dark:border-primary-500/30 pb-1">Social Media Links & WhatsApp</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="font-semibold">Facebook Page URL</span>
                <input 
                  type="text"
                  placeholder="e.g. https://facebook.com/elevatetech"
                  value={facebookUrl} 
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Twitter / X Handle URL</span>
                <input 
                  type="text"
                  placeholder="e.g. https://twitter.com/elevatetech"
                  value={twitterUrl} 
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Instagram Profile URL</span>
                <input 
                  type="text"
                  placeholder="e.g. https://instagram.com/elevatetech"
                  value={instagramUrl} 
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">LinkedIn Company URL</span>
                <input 
                  type="text"
                  placeholder="e.g. https://linkedin.com/company/elevate"
                  value={linkedinUrl} 
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">YouTube Channel URL</span>
                <input 
                  type="text"
                  placeholder="e.g. https://youtube.com/@elevatetech"
                  value={youtubeUrl} 
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="input-field py-2" 
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Official WhatsApp Number / Chat Link</span>
                <input 
                  type="text"
                  placeholder="e.g. 919673391008 or https://wa.me/919673391008"
                  value={whatsappNumber} 
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="input-field py-2 font-mono" 
                />
              </div>
            </div>
          </div>

          {/* Section 5: Customer Support Chatbot Configuration */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-accent-blue border-b border-slate-100 dark:border-primary-500/30 pb-1">AI Customer Support Chatbot</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="font-semibold">Chatbot Floating Widget Status</span>
                <select
                  value={chatbotEnabled}
                  onChange={(e) => setChatbotEnabled(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-primary-600 rounded-lg outline-none border border-slate-200 dark:border-primary-500 font-semibold"
                >
                  <option value="true">Active (Floating Chat Enabled)</option>
                  <option value="false">Disabled (Hide Chatbot)</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="font-semibold">Chatbot Welcome Greeting Message</span>
                <input 
                  type="text"
                  placeholder="e.g. Hello! Welcome to Elevate Support. How can we assist you today?"
                  value={chatbotWelcomeMessage} 
                  onChange={(e) => setChatbotWelcomeMessage(e.target.value)}
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
