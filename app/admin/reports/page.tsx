'use client';

import { useState, useEffect } from 'react';
import { 
  FunnelIcon, 
  ArrowDownTrayIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';


// Helper function to get currency symbol
const getCurrencySymbol = (currency: string): string => {
  switch (currency.toUpperCase()) {
    case 'USD':
      return '$';
    case 'INR':
      return '₹';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return currency;
  }
};

interface TransactionReport {
  id: number;
  customer_name: string;
  customer_email: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'open' | 'in_progress' | 'completed' | 'rejected';
  mtrNumber: string | null;
  created_at: string;
  approved_at: string | null;
  bank_id: number | null;
  notes: string | null;
  user_id: number;
  closing_balance: number;
}

interface CurrencySummary {
  deposits: {
    open: { amount: number; count: number };
    in_progress: { amount: number; count: number };
    completed: { amount: number; count: number };
    rejected: { amount: number; count: number };
  };
  withdrawals: {
    open: { amount: number; count: number };
    in_progress: { amount: number; count: number };
    completed: { amount: number; count: number };
    rejected: { amount: number; count: number };
  };
}

interface SummaryByCurrency {
  [currency: string]: CurrencySummary;
}

export default function AdminReports() {
  const [transactions, setTransactions] = useState<TransactionReport[]>([]);
  const [summaryByCurrency, setSummaryByCurrency] = useState<SummaryByCurrency>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Accordion state for each currency
  const [openCurrencies, setOpenCurrencies] = useState<{ [currency: string]: boolean }>({});
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 25;

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, typeFilter, statusFilter, dateFrom, dateTo, customerSearch]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(customerSearch && { search: customerSearch })
      });

      const response = await fetch(`/api/admin/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setSummaryByCurrency(data.summaryByCurrency || {});
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.total || 0);
        
        // Initialize accordion state for new currencies
        if (data.summaryByCurrency) {
          const currencies = Object.keys(data.summaryByCurrency);
          const newOpenState = { ...openCurrencies };
          currencies.forEach(currency => {
            if (!(currency in newOpenState)) {
              newOpenState[currency] = false; // Closed by default
            }
          });
          setOpenCurrencies(newOpenState);
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        export: 'csv',
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(customerSearch && { search: customerSearch })
      });

      const response = await fetch(`/api/admin/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `transaction-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'open':
        return <ClockIcon className="h-4 w-4" />;
      case 'in_progress':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setCustomerSearch('');
    setCurrentPage(1);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transaction Reports</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive view of all transactions with filtering and export capabilities
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Total Records: <span className="font-medium">{totalRecords.toLocaleString()}</span>
          </div>
          <button
            onClick={exportToCSV}
            disabled={exporting || transactions.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Financial Summary by Currency */}
      {Object.keys(summaryByCurrency).length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Financial Summary by Currency</h2>
            <p className="text-sm text-gray-600">Total credits and debits by transaction status, separated by currency</p>
          </div>
          <div className="px-6 py-4">
            {Object.entries(summaryByCurrency).map(([currency, summary]) => {
              const currencySymbol = getCurrencySymbol(currency);
              const isOpen = openCurrencies[currency] || false;
              
              return (
                <div key={currency} className="mb-4 last:mb-0">
                  {/* Accordion Header */}
                  <button
                    onClick={() => setOpenCurrencies(prev => ({ ...prev, [currency]: !prev[currency] }))}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl font-bold text-gray-700">{currencySymbol}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{currency}</h3>
                        <p className="text-sm text-gray-600">
                          {(summary.deposits.open.count + summary.deposits.in_progress.count + 
                            summary.deposits.completed.count + summary.deposits.rejected.count +
                            summary.withdrawals.open.count + summary.withdrawals.in_progress.count + 
                            summary.withdrawals.completed.count + summary.withdrawals.rejected.count)} transactions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Net Balance</div>
                        <div className={`text-lg font-bold ${
                          (summary.deposits.open.amount + summary.deposits.in_progress.amount + 
                           summary.deposits.completed.amount + summary.deposits.rejected.amount) -
                          (summary.withdrawals.open.amount + summary.withdrawals.in_progress.amount + 
                           summary.withdrawals.completed.amount + summary.withdrawals.rejected.amount) >= 0
                          ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {currencySymbol}{((summary.deposits.open.amount + summary.deposits.in_progress.amount + 
                             summary.deposits.completed.amount + summary.deposits.rejected.amount) -
                            (summary.withdrawals.open.amount + summary.withdrawals.in_progress.amount + 
                             summary.withdrawals.completed.amount + summary.withdrawals.rejected.amount)).toLocaleString()}
                        </div>
                      </div>
                      <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isOpen && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Deposits (Credits) */}
                        <div>
                          <h4 className="text-base font-semibold text-green-800 mb-4 flex items-center">
                            <ArrowDownIcon className="h-5 w-5 text-green-600 mr-2" />
                            Credits (Deposits)
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 text-blue-600 mr-2" />
                                <span className="text-sm font-medium text-blue-800">Open</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-blue-900">
                                  {currencySymbol}{summary.deposits.open.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-blue-600">
                                  {summary.deposits.open.count} transactions
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                              <div className="flex items-center">
                                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mr-2" />
                                <span className="text-sm font-medium text-yellow-800">In Progress</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-yellow-900">
                                  {currencySymbol}{summary.deposits.in_progress.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-yellow-600">
                                  {summary.deposits.in_progress.count} transactions
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center">
                                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-sm font-medium text-green-800">Completed</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-green-900">
                                  {currencySymbol}{summary.deposits.completed.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-green-600">
                                  {summary.deposits.completed.count} transactions
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center">
                                <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                                <span className="text-sm font-medium text-red-800">Rejected</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-red-900">
                                  {currencySymbol}{summary.deposits.rejected.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-red-600">
                                  {summary.deposits.rejected.count} transactions
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-2 border-green-200">
                              <span className="text-sm font-bold text-gray-800">Total Credits</span>
                              <div className="text-right">
                                <div className="text-base font-bold text-green-800">
                                  {currencySymbol}{(summary.deposits.open.amount + summary.deposits.in_progress.amount + 
                                     summary.deposits.completed.amount + summary.deposits.rejected.amount).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {summary.deposits.open.count + summary.deposits.in_progress.count + 
                                   summary.deposits.completed.count + summary.deposits.rejected.count} transactions
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Withdrawals (Debits) */}
                        <div>
                          <h4 className="text-base font-semibold text-blue-800 mb-4 flex items-center">
                            <ArrowUpIcon className="h-5 w-5 text-blue-600 mr-2" />
                            Debits (Withdrawals)
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 text-blue-600 mr-2" />
                                <span className="text-sm font-medium text-blue-800">Open</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-blue-900">
                                  {currencySymbol}{summary.withdrawals.open.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-blue-600">
                                  {summary.withdrawals.open.count} transactions
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                              <div className="flex items-center">
                                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mr-2" />
                                <span className="text-sm font-medium text-yellow-800">In Progress</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-yellow-900">
                                  {currencySymbol}{summary.withdrawals.in_progress.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-yellow-600">
                                  {summary.withdrawals.in_progress.count} transactions
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center">
                                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-sm font-medium text-green-800">Completed</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-green-900">
                                  {currencySymbol}{summary.withdrawals.completed.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-green-600">
                                  {summary.withdrawals.completed.count} transactions
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center">
                                <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                                <span className="text-sm font-medium text-red-800">Rejected</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-red-900">
                                  {currencySymbol}{summary.withdrawals.rejected.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-red-600">
                                  {summary.withdrawals.rejected.count} transactions
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-2 border-blue-200">
                              <span className="text-sm font-bold text-gray-800">Total Debits</span>
                              <div className="text-right">
                                <div className="text-base font-bold text-blue-800">
                                  {currencySymbol}{(summary.withdrawals.open.amount + summary.withdrawals.in_progress.amount + 
                                     summary.withdrawals.completed.amount + summary.withdrawals.rejected.amount).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {summary.withdrawals.open.count + summary.withdrawals.in_progress.count + 
                                   summary.withdrawals.completed.count + summary.withdrawals.rejected.count} transactions
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {(typeFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo || customerSearch) && (
              <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </button>
        </div>
        
        {showFilters && (
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdrawal">Withdrawals</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Search
                </label>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Name or email..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
               
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closing Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.customer_email}
                      </div>
                      <div className="text-xs text-gray-400">
                        User ID: {transaction.user_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {transaction.type === 'deposit' ? (
                          <ArrowDownIcon className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                          <ArrowUpIcon className="h-4 w-4 text-blue-600 mr-2" />
                        )}
                        <span className="capitalize">{transaction.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getCurrencySymbol(transaction.currency)}{transaction.amount.toLocaleString()}
                      <div className="text-xs text-gray-500">{transaction.currency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1 capitalize">{transaction.status}</span>
                      </span>
                    </td>
                   
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getCurrencySymbol(transaction.currency)}{(transaction.closing_balance || 0).toLocaleString()}
                      <div className="text-xs text-gray-500">Balance after transaction</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.approved_at ? (
                        <>
                          {new Date(transaction.approved_at).toLocaleDateString()}
                          <div className="text-xs text-gray-400">
                            {new Date(transaction.approved_at).toLocaleTimeString()}
                          </div>
                        </>
                      ) : (
                        'Not approved'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {transaction.notes || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span> ({totalRecords.toLocaleString()} total records)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
