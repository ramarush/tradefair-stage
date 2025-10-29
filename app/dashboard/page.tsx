'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import FloatingContactButton from '@/components/FloatingContactButton';
import { UserNotificationProvider, useUserNotifications } from '@/contexts/UserNotificationContext';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { 
  BanknotesIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ServerIcon,
  ArrowDownTrayIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { getUserCurrency,  formatCurrency, getCurrencyInfo } from '@/lib/currency';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  trading_platform_account_id?: number;
  trading_platform_user_id?: number;
}

interface Request {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  admin_notes?: string;
  mtr_number?: string;
}

interface DashboardStats {
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

function CustomerDashboardContent({ refreshTrigger }: { refreshTrigger?: number }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [balance, setBalance] = useState<number | null>(null);
  const [bonusBalance, setBonusBalance] = useState<number | null>(null);
  const [currencyInfo, setCurrencyInfo] = useState(getCurrencyInfo('USD'));
  const [loading, setLoading] = useState(true);
  const [showDownloads, setShowDownloads] = useState(false);
  
  // WebSocket notifications
  const { notifications, unreadCount, clearAllNotifications } = useNotifications();
  const { isConnected, hasNotificationPermission, requestAudioPermission } = useUserNotifications();

  // Auto-logout after 3 minutes of inactivity
  useAutoLogout({
    timeoutMinutes: 3,
    onLogout: () => {
      console.log('User logged out due to inactivity');
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Get user's preferred currency
    const currency = getUserCurrency();
    console.log(currency);
    setUserCurrency(currency);
    setCurrencyInfo(getCurrencyInfo(currency));
    fetchDashboardData();
  }, [router]);

  // Refresh dashboard data when WebSocket connects or when refreshTrigger changes
  useEffect(() => {
    if (isConnected) {
      fetchDashboardData();
    }
  }, [isConnected]);

  // Refresh data when refreshTrigger changes (from WebSocket notifications)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchDashboardData();
    }
  }, [refreshTrigger]);

  // Request audio permission on component mount
  useEffect(() => {
    if (!hasNotificationPermission) {
      requestAudioPermission();
    }
  }, [hasNotificationPermission, requestAudioPermission]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch user profile
      const profileResponse = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUser(profileData.user);
      }

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();

        console.log('statsData', statsData)
        setStats(statsData.stats);
      }

      // Fetch balance automatically
      await fetchBalance();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/trading-balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('data', data)
        setBalance(data.balance);
        setBonusBalance(data.bonusBalance);
        
        // Log the source of balance for debugging
        console.log(`Balance source: ${data.source}, Balance: ${data.balance}`);
        if (data.message) {
          console.log(`Balance message: ${data.message}`);
        }
      } else {
        console.error('Failed to fetch trading balance');
        
        // Fallback to local balance API if trading balance fails
        const fallbackResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/balance`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setBalance(fallbackData.balance);
          setBonusBalance(fallbackData.bonusBalance);
          console.log('Using local balance as fallback');
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      
      // Final fallback to local balance
      try {
        const token = localStorage.getItem('token');
        const fallbackResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/balance`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setBalance(fallbackData.balance);
          setBonusBalance(fallbackData.bonusBalance);
          console.log('Using local balance as final fallback');
        }
      } catch (fallbackError) {
        console.error('Error fetching fallback balance:', fallbackError);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-500 bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please log in to access your dashboard.</p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-100 bg-gray-50 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Compact Dashboard Header */}
          <div className="mb-4 py-2 sm:py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Welcome back, {user.first_name}!
            </h1>

            {/* 1. Quick Action Buttons - Compact */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Link
                href="/dashboard/deposit"
                className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <ArrowDownIcon className="h-4 w-4 mr-1" />
                MAKE DEPOSIT
              </Link>
              
              <Link
                href="/dashboard/withdrawal"
                className="flex items-center justify-center px-3 py-2 bg-red-400 text-white rounded-md hover:bg-red-500 transition-colors text-sm font-medium"
              >
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                WITHDRAW
              </Link>
              
              <Link
                href="/dashboard/ledger"
                className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                LEDGER
              </Link>
            </div>

            {/* 2. Combined Trading Platform Info - Ultra Compact */}
            <div className="bg-white rounded-lg shadow p-3 mb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {user.trading_platform_account_id ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                      <ServerIcon className="h-4 w-4 mr-1" />
                      Trading Platform Access
                    </h3>
                    <div className="space-y-1 text-xs text-blue-700">
                      <p><span className="font-medium">Account ID:</span> {user.trading_platform_account_id}</p>
                      <p><span className="font-medium">Password:</span> Same as registration</p>
                      <p><span className="font-medium">Server:</span> VENUS FX</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <ServerIcon className="h-4 w-4 mr-1" />
                      Trading Platform Access
                    </h3>
                    <p className="text-gray-600 text-xs">
                      Complete your profile to get access. Server: VENUS FX
                    </p>
                  </div>
                )}

                {/* Download Section - Card Layout */}
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <button
                    onClick={() => setShowDownloads(!showDownloads)}
                    className="flex items-center justify-between w-full text-left mb-2"
                  >
                    <h3 className="text-sm font-semibold text-green-800 flex items-center">
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download Trading Platform
                    </h3>
                    {showDownloads ? (
                      <ChevronUpIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-green-600" />
                    )}
                  </button>
                  
                  {showDownloads && (
                    <div className="space-y-2">
                      {/* Android */}
                      <a
                        href="osense.apk"
                        download="osense.apk"
                        className="flex items-center p-2 border border-gray-200 rounded-md hover:border-blue-500 hover:shadow-sm transition-all bg-white hover:cursor-pointer"
                        style={{ cursor: 'pointer !important' }}
                      >
                        <DevicePhoneMobileIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="ml-2">
                          <h4 className="text-xs font-semibold text-gray-900">Android</h4>
                          <p className="text-xs text-gray-500">APK</p>
                        </div>
                      </a>
                      {/* Windows */}
                      <a
                        href="Tradefair.exe"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-2 border border-gray-200 rounded-md hover:border-blue-500 hover:shadow-sm transition-all bg-white hover:cursor-pointer"
                        style={{ cursor: 'pointer' }}
                      >
                        <ComputerDesktopIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="ml-2">
                          <h4 className="text-xs font-semibold text-gray-900">Windows</h4>
                          <p className="text-xs text-gray-500">Desktop App</p>
                        </div>
                      </a>

                      {/* iOS */}
                      <a
                        href="https://apps.apple.com/jo/app/osense-trader/id6741929487"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-2 border border-gray-200 rounded-md hover:border-blue-500 hover:shadow-sm transition-all bg-white hover:cursor-pointer"
                        style={{ cursor: 'pointer' }}
                      >
                        <DevicePhoneMobileIcon className="h-4 w-4 text-gray-800 flex-shrink-0" />
                        <div className="ml-2">
                          <h4 className="text-xs font-semibold text-gray-900">iOS</h4>
                          <p className="text-xs text-gray-500">App Store</p>
                        </div>
                      </a>

                      
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Server Information */}
            {/* <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex items-center mb-4">
                <ServerIcon className="h-8 w-8 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900 ml-3">Trading Server Information</h2>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-lg font-semibold text-indigo-800">Server: VENUS FX</p>
                <p className="text-sm text-indigo-600 mt-1">Use this server name when logging into the trading platform</p>
              </div>
            </div> */}

          {/* Compact Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-md shadow p-3">
              <div className="flex items-center">
                <BanknotesIcon className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <div className="ml-2 min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 truncate">Trading Balance </p>
                  <p className="text-sm font-bold text-purple-600 truncate">
                    {balance !== null ? formatCurrency(balance, userCurrency) : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-3">
              <div className="flex items-center">
                <BanknotesIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="ml-2 min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 truncate">Bonus Balance</p>
                  <p className="text-sm font-bold text-green-600 truncate">
                    {bonusBalance !== null ? formatCurrency(bonusBalance, userCurrency) : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-3">
              <div className="flex items-center">
                <ArrowDownIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="ml-2 min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 truncate">Total Deposits</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {stats?.totalDeposits ? formatCurrency(stats.totalDeposits, userCurrency) : formatCurrency(0, userCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-3">
              <div className="flex items-center">
                <ArrowUpIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="ml-2 min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 truncate">Total Withdrawals</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {stats?.totalWithdrawals ? formatCurrency(stats.totalWithdrawals, userCurrency) : formatCurrency(0, userCurrency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    
      <FloatingContactButton />
    </>
  );
}

export default function CustomerDashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <NotificationProvider>
      <UserNotificationProvider onDataUpdate={handleDataUpdate}>
        <CustomerDashboardContent refreshTrigger={refreshTrigger} />
      </UserNotificationProvider>
    </NotificationProvider>
  );
}