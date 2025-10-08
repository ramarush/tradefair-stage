'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ArkSettings {
  bankId?: string;
  usdSeries?: string;
  inrSeries?: string;
  secondPassword?: string;
  branchId?: string;
  inrMainAccount?: string;
  usdMainAccount?: string;
  inrMainAccountUserId?: string;
  usdMainAccountUserId?: string;
}

export default function ArkSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<ArkSettings>({});
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
      const arkSettings = data.settings.arkVariables || {};
      setSettings(arkSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load ARK variable settings');
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

      // Update only the ARK variables section
      const updatedSettings = {
        ...currentSettings,
        arkVariables: settings
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

      setSuccess('ARK variable settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save ARK variable settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ArkSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ARK variable settings...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">ARK Variable Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure ARK system variables including bank ID and currency series
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
            <h2 className="text-lg font-medium text-gray-900">ARK System Variables</h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure system variables used by the ARK trading platform integration
            </p>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Bank ID */}
            <div>
              <label htmlFor="bankId" className="block text-sm font-medium text-gray-700">
                Bank ID
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="bankId"
                  value={settings.bankId || ''}
                  onChange={(e) => handleInputChange('bankId', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter bank ID for ARK system"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Bank identifier used in ARK trading platform transactions
              </p>
            </div>

            {/* USD Series */}
            <div>
              <label htmlFor="usdSeries" className="block text-sm font-medium text-gray-700">
                USD Series
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="usdSeries"
                  value={settings.usdSeries || ''}
                  onChange={(e) => handleInputChange('usdSeries', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter USD series identifier"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Series identifier for USD currency transactions in ARK system
              </p>
            </div>

            {/* INR Series */}
            <div>
              <label htmlFor="inrSeries" className="block text-sm font-medium text-gray-700">
                INR Series
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="inrSeries"
                  value={settings.inrSeries || ''}
                  onChange={(e) => handleInputChange('inrSeries', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter INR series identifier"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Series identifier for INR currency transactions in ARK system
              </p>
            </div>

            {/* Second Password */}
            <div>
              <label htmlFor="secondPassword" className="block text-sm font-medium text-gray-700">
                Second Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  id="secondPassword"
                  value={settings.secondPassword || ''}
                  onChange={(e) => handleInputChange('secondPassword', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter second password for trading platform"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Second password required for withdrawal requests on trading platform
              </p>
            </div>

            {/* Branch ID */}
            <div>
              <label htmlFor="branchId" className="block text-sm font-medium text-gray-700">
                Branch ID
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="branchId"
                  value={settings.branchId || ''}
                  onChange={(e) => handleInputChange('branchId', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter branch ID for trading platform"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Branch identifier used for withdrawal requests on trading platform
              </p>
            </div>

            {/* INR Main Account */}
            <div>
              <label htmlFor="inrMainAccount" className="block text-sm font-medium text-gray-700">
                INR Main Account
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="inrMainAccount"
                  value={settings.inrMainAccount || ''}
                  onChange={(e) => handleInputChange('inrMainAccount', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter INR main account identifier"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Main account identifier for INR transactions in ARK system
              </p>
            </div>

            {/* USD Main Account */}
            <div>
              <label htmlFor="usdMainAccount" className="block text-sm font-medium text-gray-700">
                USD Main Account
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="usdMainAccount"
                  value={settings.usdMainAccount || ''}
                  onChange={(e) => handleInputChange('usdMainAccount', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter USD main account identifier"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Main account identifier for USD transactions in ARK system
              </p>
            </div>

            {/* INR Main Account User ID */}
            <div>
              <label htmlFor="inrMainAccountUserId" className="block text-sm font-medium text-gray-700">
                INR Main Account User ID
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="inrMainAccountUserId"
                  value={settings.inrMainAccountUserId || ''}
                  onChange={(e) => handleInputChange('inrMainAccountUserId', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter INR main account user ID"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Main account user ID for INR money transfers in ARK system
              </p>
            </div>

            {/* USD Main Account User ID */}
            <div>
              <label htmlFor="usdMainAccountUserId" className="block text-sm font-medium text-gray-700">
                USD Main Account User ID
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="usdMainAccountUserId"
                  value={settings.usdMainAccountUserId || ''}
                  onChange={(e) => handleInputChange('usdMainAccountUserId', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter USD main account user ID"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Main account user ID for USD money transfers in ARK system
              </p>
            </div>

            {/* Information Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">ARK Variable Usage</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Bank ID:</strong> Used to identify the bank in ARK trading platform API calls</li>
                <li>• <strong>USD Series:</strong> Series code for USD transactions in the ARK system</li>
                <li>• <strong>INR Series:</strong> Series code for INR transactions in the ARK system</li>
                <li>• <strong>Second Password:</strong> Required for withdrawal requests on trading platform</li>
                <li>• <strong>Branch ID:</strong> Branch identifier for withdrawal requests on trading platform</li>
                <li>• <strong>INR Main Account:</strong> Main account identifier for INR transactions in ARK system</li>
                <li>• <strong>USD Main Account:</strong> Main account identifier for USD transactions in ARK system</li>
                <li>• <strong>INR Main Account User ID:</strong> User ID for INR main account used in money transfers</li>
                <li>• <strong>USD Main Account User ID:</strong> User ID for USD main account used in money transfers</li>
                <li>• These variables are essential for proper integration with the ARK trading platform</li>
              </ul>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save ARK Variables'}
            </button>
          </div>
        </div>

        {/* Current Settings Display */}
        {(settings.bankId || settings.usdSeries || settings.inrSeries || settings.secondPassword || settings.branchId || settings.inrMainAccount || settings.usdMainAccount || settings.inrMainAccountUserId || settings.usdMainAccountUserId) && (
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Current ARK Variables</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {settings.bankId || 'Not Set'}
                  </div>
                  <div className="text-sm text-gray-600">Bank ID</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {settings.usdSeries || 'Not Set'}
                  </div>
                  <div className="text-sm text-gray-600">USD Series</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {settings.inrSeries || 'Not Set'}
                  </div>
                  <div className="text-sm text-gray-600">INR Series</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">
                    {settings.secondPassword ? '••••••••' : 'Not Set'}
                  </div>
                  <div className="text-sm text-gray-600">Second Password</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-lg font-bold text-indigo-600">
                    {settings.branchId || 'Not Set'}
                  </div>
                  <div className="text-sm text-gray-600">Branch ID</div>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <div className="text-lg font-bold text-teal-600">
                    {settings.inrMainAccount || 'Not Set'}
                  </div>
                  <div className="text-sm text-gray-600">INR Main Account</div>
                </div>
                <div className="text-center p-4 bg-rose-50 rounded-lg">
                  <div className="text-lg font-bold text-rose-600">
                    {settings.usdMainAccount || 'Not Set'}
                  </div>
                  <div className="text-sm text-gray-600">USD Main Account</div>
                </div>
                <div className="text-center p-4 bg-cyan-50 rounded-lg">
                  <div className="text-lg font-bold text-cyan-600">
                    {settings.inrMainAccountUserId || 'Not Set'}
                  </div>
                  <div className="text-sm text-gray-600">INR Main Account User ID</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="text-lg font-bold text-amber-600">
                    {settings.usdMainAccountUserId || 'Not Set'}
                  </div>
                  <div className="text-sm text-gray-600">USD Main Account User ID</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
