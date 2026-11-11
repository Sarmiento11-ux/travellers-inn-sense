import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    hotelName: settings.hotelName || 'Travellers Inn',
    contactEmail: settings.contactEmail || 'admin@travellersinn.com',
    address: settings.address || '123 Main Street, Cityville',
    currency: settings.currency || 'PHP (₱)',
    timezone: settings.timezone || 'Asia/Manila (GMT+8)',
    aiPricing: settings.aiPricing !== false
  });

  useEffect(() => {
    setFormData({
      hotelName: settings.hotelName || 'Travellers Inn',
      contactEmail: settings.contactEmail || 'admin@travellersinn.com',
      address: settings.address || '123 Main Street, Cityville',
      currency: settings.currency || 'PHP (₱)',
      timezone: settings.timezone || 'Asia/Manila (GMT+8)',
      aiPricing: settings.aiPricing !== false
    });
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Hotel Settings</h1>

      {saved && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-medium">Settings saved successfully!</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
                <input
                  type="text"
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  rows="2"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                ></textarea>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option>PHP (₱)</option>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option>Asia/Manila (GMT+8)</option>
                  <option>UTC</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="ai-pricing"
                  name="aiPricing"
                  checked={formData.aiPricing}
                  onChange={handleChange}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="ai-pricing" className="text-sm text-gray-700 cursor-pointer">
                  Enable AI Pricing Recommendations
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-100">
            {saved && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 size={16} /> Changes saved
              </span>
            )}
            <button
              type="submit"
              className={`px-6 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all duration-300 ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
