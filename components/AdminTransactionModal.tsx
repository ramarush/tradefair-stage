'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  CurrencyDollarIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  balance: string;
  currency: string;
  currency_symbol: string;
}

interface AdminTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

interface TransactionFormData {
  amount: string;
  type: 'deposit' | 'withdrawal';
  balanceType: 'wallet' | 'bonus';
  notes: string;
  otp: string;
}

export default function AdminTransactionModal({ 
  isOpen, 
  onClose, 
  user, 
  onSuccess 
}: AdminTransactionModalProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: '',
    type: 'deposit',
    balanceType: 'wallet',
    notes: '',
    otp: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTOTPSetup, setShowTOTPSetup] = useState(false);
  const [totpSetup, setTotpSetup] = useState<{ qr: string; secret: string; instructions: string[]; qrCodeImage: string; manualEntryKey: string } | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: '',
        type: 'deposit',
        balanceType: 'wallet',
        notes: '',
        otp: ''
      });
      setError(null);
      setSuccess(null);
      setShowTOTPSetup(false);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const fetchTOTPSetup = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/totp/setup', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTotpSetup(data.setup);
        setShowTOTPSetup(true);
      } else {
        setError('Failed to load TOTP setup information');
      }
    } catch (error) {
      setError('Error loading TOTP setup');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP from your authenticator app');
      return;
    }

    // Check withdrawal balance
    if (formData.type === 'withdrawal') {
      const currentBalance = parseFloat(user.balance);
      const withdrawalAmount = parseFloat(formData.amount);
      if (withdrawalAmount > currentBalance) {
        setError(`Insufficient balance. User has ${user.currency_symbol}${currentBalance.toFixed(2)}`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/transactions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          amount: parseFloat(formData.amount),
          type: formData.type,
          balanceType: formData.balanceType,
          notes: formData.notes,
          otp: formData.otp
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to create transaction');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 flex items-center">
                    <CurrencyDollarIcon className="h-6 w-6 text-blue-600 mr-2" />
                    Create Transaction
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600">Creating transaction for:</p>
                  <p className="font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-600">
                    Current Balance: <span className="font-semibold text-green-600">
                      {user.currency}{parseFloat(user.balance).toFixed(2)}
                    </span>
                  </p>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* TOTP Setup Info */}
                {/* {!showTOTPSetup && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-800 mb-2">
                          You need an authenticator app (Google Authenticator, Authy, etc.) to create transactions.
                        </p>
                        <button
                          type="button"
                          onClick={fetchTOTPSetup}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Show setup instructions
                        </button>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* TOTP Setup Instructions */}
                {showTOTPSetup && totpSetup && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Authenticator Setup</h4>
                    <div className="space-y-2 text-sm text-yellow-700">
                      {totpSetup.instructions.map((instruction: string, index: number) => (
                        <p key={index}>{instruction}</p>
                      ))}
                    </div>
                    
                    {/* QR Code */}
                    <div className="mt-3 text-center">
                      <img 
                        src={totpSetup.qrCodeImage} 
                        alt="TOTP QR Code" 
                        className="mx-auto border rounded"
                        style={{ maxWidth: '200px' }}
                      />
                    </div>
                    
                    {/* Manual Entry */}
                    <div className="mt-3 p-2 bg-white rounded border">
                      <p className="text-xs text-gray-600 mb-1">Manual entry key:</p>
                      <code className="text-xs font-mono break-all">{totpSetup.manualEntryKey}</code>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setShowTOTPSetup(false)}
                      className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
                    >
                      Hide setup instructions
                    </button>
                  </div>
                )}

                {/* Transaction Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Transaction Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="deposit">Deposit (Add Money)</option>
                      <option value="withdrawal">Withdrawal (Deduct Money)</option>
                    </select>
                  </div>

                  {/* Balance Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Balance Type
                    </label>
                    <select
                      name="balanceType"
                      value={formData.balanceType || 'wallet'}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="wallet">Wallet Balance</option>
                      <option value="bonus">Bonus Balance</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount ({user.currency_symbol})
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Reason for this transaction..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={loading}
                    />
                  </div>

                  {/* OTP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 mr-1" />
                      6-Digit OTP from Authenticator App
                    </label>
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleInputChange}
                      placeholder="123456"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !formData.amount || !formData.otp}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        `Create ${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}`
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
