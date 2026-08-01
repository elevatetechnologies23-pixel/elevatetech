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
}

const defaultSettings: Settings = {
  companyName: 'Elevate Technology',
  companyEmail: 'info@elevatetechnology.com',
  companyPhone: '+91 96733 91008',
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
  whatsappNumber: '919673391008',
  chatbotEnabled: 'true',
  chatbotWelcomeMessage: 'Hello! Welcome to Elevate Technology Customer Support. How can we assist you today?',
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
