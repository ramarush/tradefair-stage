'use client';

import { useEffect, useState } from 'react';
import { EyeIcon, CheckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Withdrawal {
  id: number;
  amount: string;
  currency: string;
  currency_symbol: string;
  bank_details?: any;
  account_details?: string;
  mtr_number?: string;
  status: 'open' | 'in_progress' | 'completed' | 'rejected';
  admin_notes?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  processed_by_name?: string;
  processed_by_lastname?: string;
}

export default function WithdrawalsManagement() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updateData, setUpdateData] = useState({
    status: '',
    mtr_number: '',
    admin_notes: '',
    approved_at: ''
  });

  // New state for approve/reject workflow
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [mtrNumber, setMtrNumber] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter,
      });
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/withdrawals?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewWithdrawal = async (withdrawal: Withdrawal) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/withdrawals/${withdrawal.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedWithdrawal(data.withdrawal);
        setUpdateData({
          status: data.withdrawal.status,
          mtr_number: data.withdrawal.mtr_number || '',
          admin_notes: data.withdrawal.admin_notes || '',
          approved_at: data.withdrawal.approved_at || ''
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching withdrawal details:', error);
    }
  };

  const handleUpdateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/withdrawals/${selectedWithdrawal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setShowModal(false);
        setSelectedWithdrawal(null);
        fetchWithdrawals();
      } else {
        const error = await response.json();
        alert(error.error || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // New approve handler
  const handleApprove = async () => {
    if (!selectedWithdrawal || !mtrNumber.trim()) {
      alert('Please enter MTR number');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/withdrawals/${selectedWithdrawal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'completed',
          mtr_number: mtrNumber,
          admin_notes: 'Approved by admin'
        }),
      });

      if (response.ok) {
        alert('Withdrawal approved successfully!');
        setShowModal(false);
        setSelectedWithdrawal(null);
        setActionType(null);
        setMtrNumber('');
        fetchWithdrawals();
      } else {
        const error = await response.json();
        alert(error.error || 'Approval failed');
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // New reject handler
  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      alert('Please enter rejection reason');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/withdrawals/${selectedWithdrawal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'rejected',
          admin_notes: rejectionReason
        }),
      });

      if (response.ok) {
        alert('Withdrawal rejected successfully!');
        setShowModal(false);
        setSelectedWithdrawal(null);
        setActionType(null);
        setRejectionReason('');
        fetchWithdrawals();
      } else {
        const error = await response.json();
        alert(error.error || 'Rejection failed');
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case 'in_progress':
        return <ClockIcon className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckIcon className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XMarkIcon className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (loading && withdrawals.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Withdrawal Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Process customer withdrawal requests and manage MTR numbers.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by MTR number or customer name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">All Withdrawals</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MTR Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {withdrawal.first_name} {withdrawal.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{withdrawal.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {withdrawal.currency_symbol}{parseFloat(withdrawal.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {withdrawal.mtr_number || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                            {getStatusIcon(withdrawal.status)}
                            <span className="ml-1 capitalize">{withdrawal.status.replace('_', ' ')}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {withdrawal.approved_at ? new Date(withdrawal.approved_at).toLocaleDateString() : 'Not approved'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewWithdrawal(withdrawal)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Withdrawal Details Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Withdrawal Request Details
              </h3>
              
              {/* Customer Info */}
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                <p className="text-sm text-gray-600">
                  <strong>Name:</strong> {selectedWithdrawal.first_name} {selectedWithdrawal.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {selectedWithdrawal.email}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Amount:</strong> {selectedWithdrawal.currency_symbol}{parseFloat(selectedWithdrawal.amount).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Created:</strong> {new Date(selectedWithdrawal.created_at).toLocaleString()}
                </p>
                {selectedWithdrawal.approved_at && (
                  <p className="text-sm text-gray-600">
                    <strong>Approved:</strong> {new Date(selectedWithdrawal.approved_at).toLocaleString()}
                  </p>
                )}
                {(selectedWithdrawal.bank_details || selectedWithdrawal.account_details) && (
                  <div className="mt-2">
                    <strong className="text-sm text-gray-600">Bank Details:</strong>
                    <div className="mt-1 p-2 bg-white border border-gray-200 rounded text-xs text-gray-700">
                      {selectedWithdrawal.bank_details && typeof selectedWithdrawal.bank_details === 'object' ? (
                        <div className="space-y-1">
                          {selectedWithdrawal.bank_details.bankName && (
                            <div><strong>Bank:</strong> {selectedWithdrawal.bank_details.bankName}</div>
                          )}
                          {selectedWithdrawal.bank_details.accountNumber && (
                            <div><strong>Account:</strong> {selectedWithdrawal.bank_details.accountNumber}</div>
                          )}
                          {selectedWithdrawal.bank_details.accountHolder && (
                            <div><strong>Holder:</strong> {selectedWithdrawal.bank_details.accountHolder}</div>
                          )}
                          {selectedWithdrawal.bank_details.ifscCode && selectedWithdrawal.bank_details.ifscCode !== 'N/A' && (
                            <div><strong>IFSC:</strong> {selectedWithdrawal.bank_details.ifscCode}</div>
                          )}
                        </div>
                      ) : (
                        <div>{selectedWithdrawal.bank_details || selectedWithdrawal.account_details}</div>
                      )}
                    </div>
                  </div>
                )}
                {selectedWithdrawal.processed_by_name && (
                  <p className="text-sm text-gray-600">
                    <strong>Processed by:</strong> {selectedWithdrawal.processed_by_name} {selectedWithdrawal.processed_by_lastname}
                  </p>
                )}
              </div>

              {/* Show form only for open/in_progress withdrawals, read-only for completed/rejected */}
              {selectedWithdrawal.status === 'completed' || selectedWithdrawal.status === 'rejected' ? (
                // Read-only view for completed/rejected withdrawals
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Status:</strong> This withdrawal has been {selectedWithdrawal.status} and cannot be modified.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">
                      {selectedWithdrawal.status.charAt(0).toUpperCase() + selectedWithdrawal.status.slice(1)}
                    </div>
                  </div>

                  {selectedWithdrawal.mtr_number && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">MTR Number</label>
                      <div className="mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">
                        {selectedWithdrawal.mtr_number}
                      </div>
                    </div>
                  )}

                  {selectedWithdrawal.admin_notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                      <div className="mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedWithdrawal.admin_notes}
                      </div>
                    </div>
                  )}

                  {selectedWithdrawal.approved_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Approved At</label>
                      <div className="mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">
                        {new Date(selectedWithdrawal.approved_at).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedWithdrawal(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                // New approve/reject workflow for open/in_progress withdrawals
                <div className="space-y-4">
                  {!actionType ? (
                    // Show action selection buttons
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">
                          Choose an action for this withdrawal request:
                        </p>
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() => setActionType('approve')}
                            className="flex items-center px-6 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <CheckIcon className="h-5 w-5 mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => setActionType('reject')}
                            className="flex items-center px-6 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <XMarkIcon className="h-5 w-5 mr-2" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : actionType === 'approve' ? (
                    // Show MTR number input for approval
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-4">
                          <CheckIcon className="h-8 w-8 text-green-600 mr-2" />
                          <h3 className="text-lg font-medium text-gray-900">Approve Withdrawal</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Please enter the MTR number to complete the approval:
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">MTR Number *</label>
                        <input
                          type="text"
                          value={mtrNumber}
                          onChange={(e) => setMtrNumber(e.target.value)}
                          placeholder="Enter MTR number..."
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setActionType(null);
                            setMtrNumber('');
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleApprove}
                          disabled={loading || !mtrNumber.trim()}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Approving...' : 'Confirm Approval'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Show rejection reason input
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-4">
                          <XMarkIcon className="h-8 w-8 text-red-600 mr-2" />
                          <h3 className="text-lg font-medium text-gray-900">Reject Withdrawal</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Please provide a reason for rejecting this withdrawal:
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Rejection Reason *</label>
                        <textarea
                          rows={3}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter reason for rejection..."
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setActionType(null);
                            setRejectionReason('');
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={loading || !rejectionReason.trim()}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Rejecting...' : 'Confirm Rejection'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Close button for the modal */}
                  <div className="flex justify-center pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedWithdrawal(null);
                        setActionType(null);
                        setMtrNumber('');
                        setRejectionReason('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
