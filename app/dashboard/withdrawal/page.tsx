'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeftIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { getUserCurrency, formatCurrency, getCurrencyInfo } from '@/lib/currency';

interface WithdrawalFormData {
  amount: number;
  bankAccountId: number | null;
}

interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isActive: boolean;
}

export default function WithdrawalRequest() {
  const router = useRouter();
  const [formData, setFormData] = useState<WithdrawalFormData>({
    amount: 0,
    bankAccountId: null,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [currencyInfo, setCurrencyInfo] = useState(getCurrencyInfo('USD'));
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [tradingBalance, setTradingBalance] = useState<number>(0);
  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const withdrawableBalance = Math.max(0, tradingBalance - bonusBalance);
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    ifscCode: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Get user's preferred currency
    const currency = getUserCurrency();
    setUserCurrency(currency);
    setCurrencyInfo(getCurrencyInfo(currency));
    
    // Fetch user's bank accounts and balance
    fetchBankAccounts();
    fetchUserBalance();
  }, [router]);

  const fetchBankAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/bank-accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.bankAccounts || []);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch local bonus balance
      const localResponse = await fetch('/api/user/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (localResponse.ok) {
        const localData = await localResponse.json();
        setBonusBalance(localData.bonusBalance || 0);
      }

      // Fetch trading platform balance
      const tradingResponse = await fetch('/api/user/trading-balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (tradingResponse.ok) {
        const tradingData = await tradingResponse.json();
        setTradingBalance(tradingData.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/bank-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newBankAccount),
      });

      if (response.ok) {
        await fetchBankAccounts(); // Refresh bank accounts list
        setShowAddBankAccount(false);
        setNewBankAccount({
          bankName: '',
          accountNumber: '',
          accountHolder: '',
          ifscCode: ''
        });
        alert('Bank account added successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add bank account');
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (formData.amount > withdrawableBalance) {
      alert(`Insufficient balance. Maximum withdrawable amount is ${formatCurrency(withdrawableBalance, userCurrency)}`);
      return;
    }
    
    if (!formData.bankAccountId) {
      alert('Please select a bank account');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const transactionData = {
        type: 'withdrawal',
        amount: formData.amount,
        bankId: formData.bankAccountId,
        currency: userCurrency
      };
      
      const response = await fetch('/api/user/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          amount: 0,
          bankAccountId: null,
        });
        // Refresh balance after successful withdrawal
        await fetchUserBalance();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <ArrowUpIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Withdrawal Request Submitted!
            </h2>
            <p className="text-gray-600 mb-6">
              Your withdrawal request has been submitted successfully. Our team will review and process it according to our withdrawal policy.
              You will receive updates on the status of your request.
            </p>
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Dashboard
              </Link>
              <div>
                <Link
                  href="/dashboard/withdrawals"
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  View All Withdrawals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Request Withdrawal</h1>
          <p className="mt-2 text-gray-600">
            Submit a withdrawal request to transfer funds from your account.
          </p>
        </div>

        {/* Balance Information */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Balance Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-blue-600">Trading Platform Balance</p>
                <p className="text-xl font-bold text-blue-900">
                  {formatCurrency(tradingBalance, userCurrency)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-blue-600">Bonus Balance (Non-withdrawable)</p>
                <p className="text-xl font-bold text-red-600">
                  -{formatCurrency(bonusBalance, userCurrency)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="text-center">
                <p className="text-sm text-blue-600">Available for Withdrawal</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(withdrawableBalance, userCurrency)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Trading Platform Balance - Bonus Balance
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Withdrawal Information</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount * ({currencyInfo?.name})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={withdrawableBalance}
                  step="0.01"
                  required
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="block w-full pl-7 px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Minimum withdrawal amount is {formatCurrency(10, userCurrency)}
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Bank Account *
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddBankAccount(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  + Add Bank Account
                </button>
              </div>
              {bankAccounts.length === 0 ? (
                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
                  <p className="text-gray-500">No bank accounts found.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddBankAccount(true)}
                    className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Add Your First Bank Account
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={formData.bankAccountId || ''}
                  onChange={(e) => setFormData({ ...formData, bankAccountId: parseInt(e.target.value) || null })}
                  className="block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
                >
                  <option value="">Select bank account</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber.slice(-4)} ({account.accountHolder})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Add Bank Account Form */}
            {showAddBankAccount && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Bank Account</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddBankAccount(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBankAccount.accountHolder}
                      onChange={(e) => setNewBankAccount({ ...newBankAccount, accountHolder: e.target.value })}
                      className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      placeholder="Enter account holder name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBankAccount.bankName}
                      onChange={(e) => setNewBankAccount({ ...newBankAccount, bankName: e.target.value })}
                      className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      placeholder="Enter bank name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBankAccount.accountNumber}
                      onChange={(e) => setNewBankAccount({ ...newBankAccount, accountNumber: e.target.value })}
                      className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      placeholder="Enter account number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IFSC Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBankAccount.ifscCode}
                      onChange={(e) => setNewBankAccount({ ...newBankAccount, ifscCode: e.target.value.toUpperCase() })}
                      className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      placeholder="Enter IFSC code (e.g., SBIN0001234)"
                      maxLength={11}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddBankAccount(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddBankAccount}
                      disabled={loading || !newBankAccount.accountHolder || !newBankAccount.bankName || !newBankAccount.accountNumber || !newBankAccount.ifscCode}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Adding...' : 'Add Account'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Available for Withdrawal</h3>
                  <p className="text-lg font-semibold text-blue-900">
                    {formatCurrency(withdrawableBalance, userCurrency)}
                  </p>
                </div>
                {formData.amount > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Balance After Withdrawal</h3>
                    <p className={`text-lg font-semibold ${formData.amount > withdrawableBalance ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.max(0, withdrawableBalance - formData.amount), userCurrency)}
                    </p>
                    {formData.amount > withdrawableBalance && (
                      <p className="text-xs text-red-600 mt-1">Insufficient balance</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                 disabled={loading || !formData.amount || !formData.bankAccountId || formData.amount > withdrawableBalance || formData.amount < 10}
                className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
