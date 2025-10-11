'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowDownIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface DepositRequest {
  id: number;
  amount: number;
  payment_method: string;
  notes?: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchDeposits();
  }, [router]);

  const fetchDeposits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/transactions?type=deposit`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeposits(data.transactions || []);
      } else {
        setError('Failed to fetch deposits');
      }
    } catch (err) {
      setError('An error occurred while fetching deposits');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-20 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your deposits...</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Deposit History</h1>
                <p className="mt-2 text-gray-600">
                  View all your deposit requests and their current status.
                </p>
              </div>
              <Link
                href="/dashboard/deposit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                New Deposit
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Deposits List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {deposits.length === 0 ? (
              <div className="text-center py-12">
                <ArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No deposits</h3>
                <p className="mt-1 text-sm text-gray-500">
                  We couldn&apos;t find any deposits matching your search.
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/deposit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <ArrowDownIcon className="-ml-1 mr-2 h-5 w-5" />
                    Make Deposit
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {deposits.map((deposit) => (
                  <li key={deposit.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ArrowDownIcon className="h-8 w-8 text-green-600 mr-4" />
                        <div>
                          <div className="flex items-center">
                            <p className="text-lg font-semibold text-gray-900">
                              ${deposit.amount.toLocaleString()}
                            </p>
                            <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}>
                              {getStatusIcon(deposit.status)}
                              <span className="ml-1 capitalize">{deposit.status.replace('_', ' ')}</span>
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <p>Method: {deposit.payment_method}</p>
                            <p>Requested: {new Date(deposit.created_at).toLocaleDateString()}</p>
                            {deposit.notes && (
                              <p className="text-gray-500">Notes: {deposit.notes}</p>
                            )}
                          </div>
                          {deposit.admin_notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                              <strong>Admin Notes:</strong> {deposit.admin_notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Updated: {new Date(deposit.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Back to Dashboard */}
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
