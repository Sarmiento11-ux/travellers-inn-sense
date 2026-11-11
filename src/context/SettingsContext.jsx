import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultSettings = {
  hotelName: 'Travellers Inn',
  contactEmail: 'admin@travellersinn.com',
  address: '123 Main Street, Cityville',
  currency: 'PHP (₱)',
  timezone: 'Asia/Manila (GMT+8)',
  aiPricing: true,
};

const SettingsContext = createContext({
  settings: defaultSettings,
  currencySymbol: '₱',
  formatPrice: (amount) => `₱${Number(amount || 0).toLocaleString()}`,
  updateSettings: () => {},
});

export const getCurrencySymbol = (currencyStr = '') => {
  if (currencyStr.includes('EUR') || currencyStr.includes('€')) return '€';
  if (currencyStr.includes('USD') || currencyStr.includes('$')) return '$';
  return '₱';
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('hotelSettings');
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse hotelSettings from localStorage:', e);
    }
    return defaultSettings;
  });

  const currencySymbol = getCurrencySymbol(settings.currency);

  const formatPrice = (amount) => {
    const num = Number(amount || 0);
    return `${currencySymbol}${num.toLocaleString()}`;
  };

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    try {
      localStorage.setItem('hotelSettings', JSON.stringify(merged));
      // Dispatch custom event for any non-react listeners
      window.dispatchEvent(new Event('hotelSettingsChanged'));
    } catch (e) {
      console.error('Failed to save hotelSettings to localStorage:', e);
    }
  };

  useEffect(() => {
    // Listen for storage events in case of multiple tabs
    const handleStorage = (e) => {
      if (e.key === 'hotelSettings' && e.newValue) {
        try {
          setSettings(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, currencySymbol, formatPrice, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
