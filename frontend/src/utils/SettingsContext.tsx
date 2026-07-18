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
}

const defaultSettings: Settings = {
  companyName: 'Elevate Technology',
  companyEmail: 'info@elevatetechnology.com',
  companyPhone: '+91 98765 43210',
  companyAddress: 'Bengaluru, Karnataka, India',
  logoUrl: '',
  heroBannerTitle: 'B2B Enterprise Electronics Procurement',
  heroBannerSubtitle: 'Streamline hardware procurement, licensing, and IT support',
  gstPercentage: '18',
  shippingLimit: '5000',
  shippingCharge: '150',
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
