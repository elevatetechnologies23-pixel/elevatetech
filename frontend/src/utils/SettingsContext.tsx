import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface Settings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  logoUrl: string;
  heroBannerTitle: string;
  heroBannerSubtitle: string;
  gstPercentage: string;
  shippingLimit: string;
  shippingCharge: string;
  // Social Media Links (Admin Managed)
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  whatsappNumber: string;
  // Chatbot Settings (Admin Managed)
  chatbotEnabled: string;
  chatbotWelcomeMessage: string;
  // Billing Software Page Settings (Admin Managed)
  billingSoftwareTitle: string;
  billingSoftwareSubtitle: string;
  billingSoftwareVersion: string;
}

const defaultSettings: Settings = {
  companyName: 'Elevate Technology',
  companyEmail: 'elevatetechnologies23@gmail.com',
  companyPhone: '+91 9922567375',
  companyAddress: 'Bengaluru, Karnataka, India',
  logoUrl: '',
  heroBannerTitle: 'B2B Enterprise Electronics Procurement',
  heroBannerSubtitle: 'Streamline hardware procurement, licensing, and IT support',
  gstPercentage: '18',
  shippingLimit: '5000',
  shippingCharge: '150',
  facebookUrl: 'https://facebook.com',
  twitterUrl: 'https://twitter.com',
  instagramUrl: 'https://instagram.com',
  linkedinUrl: 'https://linkedin.com',
  youtubeUrl: 'https://youtube.com',
  whatsappNumber: '919922567375',
  chatbotEnabled: 'true',
  chatbotWelcomeMessage: 'Hello! Welcome to Elevate Technology Customer Support. How can we assist you today?',
  billingSoftwareTitle: 'Enterprise POS Billing Software',
  billingSoftwareSubtitle: 'Offline-first desktop software for retail invoicing, stock control, and automated GST reporting. Fully integrated with standard POS terminals and barcode scanners.',
  billingSoftwareVersion: 'v5.2.14-Windows'
};

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  reloadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  reloadSettings: async () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const reloadSettings = async () => {
    try {
      const res = await api.get('/admin/settings/public');
      if (res.data?.data) {
        setSettings({
          ...defaultSettings,
          ...res.data.data,
        });
      }
    } catch (err) {
      console.warn('Failed to load branding settings, using defaults:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, reloadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
