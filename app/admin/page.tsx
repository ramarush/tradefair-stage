'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminNotifications } from '../../contexts/AdminNotificationContext';

function BonusProcessingButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleProcessBonuses = async () => {
    setIsProcessing(true);
    setLastResult(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/process-bonuses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setLastResult(`✅ Processed ${result.processed} transactions, awarded ${result.bonusesAwarded} bonuses`);
      } else {
        setLastResult(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error processing bonuses:', error);
      setLastResult('❌ Failed to process bonuses');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
      <div className="text-center">
        <div className="text-3xl mb-2">🎁</div>
        <h3 className="font-medium text-gray-900 mb-2">Process Campaign Bonuses</h3>
        <p className="text-sm text-gray-500 mb-4">Run bonus processing for active campaigns</p>
        
        <button
          onClick={handleProcessBonuses}
          disabled={isProcessing}
          className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isProcessing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Run Bonus Processing'}
        </button>
        
        {lastResult && (
          <div className="mt-3 text-xs text-left bg-gray-50 p-2 rounded border">
            {lastResult}
          </div>
        )}
      </div>
    </div>
  );
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  publishedNews: number;
  publishedBlogs: number;
}

function AdminDashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    publishedNews: 0,
    publishedBlogs: 0,
  });
  const [loading, setLoading] = useState(true);
  const { data: realTimeData, isLoading: realTimeLoading } = useAdminNotifications();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Update stats with real-time data when available
  useEffect(() => {
    if (realTimeData && !realTimeLoading) {
      setStats(prev => ({
        ...prev,
        pendingDeposits: realTimeData.pendingDeposits,
        pendingWithdrawals: realTimeData.pendingWithdrawals
      }));
    }
  }, [realTimeData, realTimeLoading]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: '✅',
      color: 'bg-green-500',
      link: '/admin/users',
    },
    {
      title: 'Pending Deposits',
      value: stats.pendingDeposits,
      icon: '💰',
      color: 'bg-yellow-500',
      link: '/admin/deposits',
    },
    {
      title: 'Pending Withdrawals',
      value: stats.pendingWithdrawals,
      icon: '💸',
      color: 'bg-red-500',
      link: '/admin/withdrawals',
    },
    {
      title: 'Published News',
      value: stats.publishedNews,
      icon: '📰',
      color: 'bg-purple-500',
      link: '/admin/news',
    },
    {
      title: 'Published Blogs',
      value: stats.publishedBlogs,
      icon: '📝',
      color: 'bg-indigo-500',
      link: '/admin/blogs',
    }
  ];

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of your TradeFair platform statistics and quick actions.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Link key={card.title} href={card.link}>
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${card.color} rounded-md p-3`}>
                      <span className="text-white text-2xl">{card.icon}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {card.value.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Link
            href="/admin/users"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-medium text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-500 mt-1">Create, edit, and manage user accounts</p>
            </div>
          </Link>

          <Link
            href="/admin/deposits"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-medium text-gray-900">Process Deposits</h3>
              <p className="text-sm text-gray-500 mt-1">Review and approve deposit requests</p>
            </div>
          </Link>

          <Link
            href="/admin/withdrawals"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">💸</div>
              <h3 className="font-medium text-gray-900">Process Withdrawals</h3>
              <p className="text-sm text-gray-500 mt-1">Handle withdrawal requests and MTR numbers</p>
            </div>
          </Link>

          <Link
            href="/admin/news"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">📰</div>
              <h3 className="font-medium text-gray-900">Publish News</h3>
              <p className="text-sm text-gray-500 mt-1">Create and manage news articles</p>
            </div>
          </Link>

          <Link
            href="/admin/reports"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-medium text-gray-900">Transaction Reports</h3>
              <p className="text-sm text-gray-500 mt-1">View and export transaction data</p>
            </div>
          </Link>

          <Link
            href="/admin/bank-accounts"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🏦</div>
              <h3 className="font-medium text-gray-900">Bank Accounts</h3>
              <p className="text-sm text-gray-500 mt-1">View and manage all bank accounts</p>
            </div>
          </Link>
          <Link
            href="/admin/analytics"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-medium text-gray-900">UTM Analytics</h3>
              <p className="text-sm text-gray-500 mt-1">View and manage UTM analytics data</p>
            </div>
          </Link>

          <Link
            href="/admin/marketing"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-medium text-gray-900">Marketing Settings</h3>
              <p className="text-sm text-gray-500 mt-1">Create and manage marketing campaigns</p>
            </div>
          </Link>

          
          <Link
            href="/admin/payment-methods"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">💳</div>
              <h3 className="font-medium text-gray-900">Payment Methods</h3>
              <p className="text-sm text-gray-500 mt-1">Manage payment methods</p>
            </div>
          </Link>

          <Link
            href="/admin/exchange-rates"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">💱</div>
              <h3 className="font-medium text-gray-900">Exchange Rate Settings</h3>
              <p className="text-sm text-gray-500 mt-1">Manage USD deposit/withdrawal rates</p>
            </div>
          </Link>

          <Link
            href="/admin/ark-settings"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="text-center">
              <div className="text-3xl mb-2">⚙️</div>
              <h3 className="font-medium text-gray-900">ARK Variable Settings</h3>
              <p className="text-sm text-gray-500 mt-1">Configure bankID and series settings</p>
            </div>
          </Link>
        </div>
      </div>

      {/* System Actions */}
      <div className="mt-12">
        <h2 className="text-lg font-medium text-gray-900 mb-6">System Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BonusProcessingButton />
        </div>
      </div>
    </div>
  );
}

// Main component - notification providers now handled globally in layout
export default function AdminDashboard() {
  return <AdminDashboardContent />;
}
