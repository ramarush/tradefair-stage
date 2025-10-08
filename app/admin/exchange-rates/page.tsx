'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ExchangeRateSettings {
  usdWithdrawalRate?: number;
  usdDepositRate?: number;
}

export default function ExchangeRatesPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<ExchangeRateSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/system-settings',{
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const data = await response.json();
      const exchangeRates = data.settings.exchangeRates || {};
      setSettings(exchangeRates);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load exchange rate settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Get current system settings
      const currentResponse = await fetch('/api/admin/system-settings',{
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const currentData = await currentResponse.json();
      const currentSettings = currentData.settings || {};

      // Update only the exchange rates section
      const updatedSettings = {
        ...currentSettings,
        exchangeRates: settings
      };

      const response = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ settings: updatedSettings }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setSuccess('Exchange rate settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save exchange rate settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ExchangeRateSettings, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setSettings(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exchange rate settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to Admin Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Exchange Rate Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure USD to INR exchange rates for deposits and withdrawals
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-800">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="text-green-800">{success}</div>
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">USD Exchange Rates</h2>
            <p className="mt-1 text-sm text-gray-500">
              Set the exchange rates for converting USD to INR for deposits and withdrawals
            </p>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* USD Deposit Rate */}
            <div>
              <label htmlFor="usdDepositRate" className="block text-sm font-medium text-gray-700">
                USD Deposit Exchange Rate
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  id="usdDepositRate"
                  step="0.01"
                  min="0"
                  value={settings.usdDepositRate || ''}
                  onChange={(e) => handleInputChange('usdDepositRate', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="83.50"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">per USD</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Rate used when users deposit money in USD. This rate determines how much INR they need to pay.
              </p>
            </div>

            {/* USD Withdrawal Rate */}
            <div>
              <label htmlFor="usdWithdrawalRate" className="block text-sm font-medium text-gray-700">
                USD Withdrawal Exchange Rate
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  id="usdWithdrawalRate"
                  step="0.01"
                  min="0"
                  value={settings.usdWithdrawalRate || ''}
                  onChange={(e) => handleInputChange('usdWithdrawalRate', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="83.00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">per USD</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Rate used when users withdraw money in USD. This rate determines how much INR they receive.
              </p>
            </div>

            {/* Usage Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">How Exchange Rates Work</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• When a USD user makes a deposit, they see the INR amount they need to pay based on the deposit rate</li>
                <li>• When a USD user makes a withdrawal, they receive INR based on the withdrawal rate</li>
                <li>• QR codes and payment instructions will show the converted INR amount</li>
                <li>• If rates are not set, USD users will see an error message</li>
              </ul>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Exchange Rates'}
            </button>
          </div>
        </div>

        {/* Current Rates Display */}
        {(settings.usdDepositRate || settings.usdWithdrawalRate) && (
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Current Exchange Rates</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{settings.usdDepositRate || 'Not Set'}
                  </div>
                  <div className="text-sm text-gray-600">USD Deposit Rate</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{settings.usdWithdrawalRate || 'Not Set'}
                  </div>
                  <div className="text-sm text-gray-600">USD Withdrawal Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
