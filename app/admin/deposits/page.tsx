'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { formatTableTimestamp } from '@/lib/dateUtils';
import { useAdminNotifications } from '@/contexts/AdminNotificationContext';
import ConfirmationModal from '@/components/ConfirmationModal';
import InputModal from '@/components/InputModal';
import ImagePreviewModal from '@/components/ImagePreviewModal';

interface Deposit {
  id: number;
  amount: string;
  currency: string;
  currency_symbol: string;
  mtr_number?: string;
  status: 'pending' | 'verification' | 'completed' | 'rejected';
  admin_notes?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  processed_by_name?: string;
  processed_by_lastname?: string;
  media_url?: string;
  media_filename?: string;
}

export default function DepositsManagement() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updateData, setUpdateData] = useState({
    status: '',
    admin_notes: ''
  });

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'danger' | 'warning' | 'info',
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => {},
    loading: false
  });

  // Input modal state for rejection reason
  const [inputModal, setInputModal] = useState({
    isOpen: false,
    type: 'danger' as 'danger' | 'warning' | 'info',
    title: '',
    message: '',
    placeholder: '',
    confirmText: 'Submit',
    onSubmit: (value: string) => {},
    loading: false,
    pendingDeposit: null as Deposit | null
  });

  // Image preview modal state
  const [imagePreviewModal, setImagePreviewModal] = useState({
    isOpen: false,
    imageUrl: '',
    imageTitle: '',
    deposit: null as Deposit | null
  });

  useEffect(() => {
    fetchDeposits();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchDeposits = async () => {
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

      const response = await fetch(`/api/admin/deposits?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeposits(data.deposits);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDeposit = async (deposit: Deposit) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/deposits/${deposit.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedDeposit(data.deposit);
        setUpdateData({
          status: data.deposit.status,
          admin_notes: data.deposit.admin_notes || ''
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching deposit details:', error);
    }
  };

  const handleApproveDeposit = (deposit: Deposit) => {
    if (deposit.status === 'completed') {
      setConfirmationModal({
        isOpen: true,
        type: 'warning',
        title: 'Already Approved',
        message: 'This deposit has already been approved and cannot be approved again.',
        confirmText: 'OK',
        onConfirm: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
        loading: false
      });
      return;
    }

    setConfirmationModal({
      isOpen: true,
      type: 'success',
      title: 'Approve Deposit',
      message: `Are you sure you want to approve this deposit of ${deposit.currency_symbol}${parseFloat(deposit.amount).toLocaleString()} for ${deposit.first_name} ${deposit.last_name}?\n\nThis will credit the user's balance and cannot be undone.`,
      confirmText: 'Approve Deposit',
      onConfirm: () => performApproveDeposit(deposit),
      loading: false
    });
  };

  const performApproveDeposit = async (deposit: Deposit) => {
    setConfirmationModal(prev => ({ ...prev, loading: true }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/deposits/${deposit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'completed',
          admin_notes: 'Approved by admin'
        }),
      });

      if (response.ok) {
        setConfirmationModal({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Deposit approved successfully! User balance has been credited.',
          confirmText: 'OK',
          onConfirm: () => {
            setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            fetchDeposits(); // Refresh the list
          },
          loading: false
        });
      } else {
        const error = await response.json();
        setConfirmationModal({
          isOpen: true,
          type: 'danger',
          title: 'Approval Failed',
          message: error.error || 'Failed to approve deposit. Please try again.',
          confirmText: 'OK',
          onConfirm: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
          loading: false
        });
      }
    } catch (error) {
      console.error('Error approving deposit:', error);
      setConfirmationModal({
        isOpen: true,
        type: 'danger',
        title: 'Error',
        message: 'An error occurred while approving the deposit. Please try again.',
        confirmText: 'OK',
        onConfirm: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
        loading: false
      });
    }
  };

  const handleRejectDeposit = (deposit: Deposit) => {
    if (deposit.status === 'rejected') {
      setConfirmationModal({
        isOpen: true,
        type: 'warning',
        title: 'Already Rejected',
        message: 'This deposit has already been rejected.',
        confirmText: 'OK',
        onConfirm: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
        loading: false
      });
      return;
    }

    if (deposit.status === 'completed') {
      setConfirmationModal({
        isOpen: true,
        type: 'warning',
        title: 'Cannot Reject',
        message: 'Cannot reject an already approved deposit.',
        confirmText: 'OK',
        onConfirm: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
        loading: false
      });
      return;
    }

    // Show rejection confirmation first
    setConfirmationModal({
      isOpen: true,
      type: 'danger',
      title: 'Reject Deposit',
      message: `Are you sure you want to reject this deposit of ${deposit.currency_symbol}${parseFloat(deposit.amount).toLocaleString()} for ${deposit.first_name} ${deposit.last_name}?\n\nThis action cannot be undone.`,
      confirmText: 'Continue to Reject',
      onConfirm: () => {
        // Close confirmation modal and open input modal for reason
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
        setInputModal({
          isOpen: true,
          type: 'danger',
          title: 'Rejection Reason',
          message: `Please provide a reason for rejecting this deposit. This will help the customer understand why their deposit was not approved.`,
          placeholder: 'Enter rejection reason (optional)...',
          confirmText: 'Reject Deposit',
          onSubmit: (reason: string) => performRejectDeposit(deposit, reason),
          loading: false,
          pendingDeposit: deposit
        });
      },
      loading: false
    });
  };

  const performRejectDeposit = async (deposit: Deposit, reason: string) => {
    setInputModal(prev => ({ ...prev, loading: true }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/deposits/${deposit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'rejected',
          admin_notes: reason || 'Rejected by admin'
        }),
      });

      if (response.ok) {
        // Close input modal and show success confirmation
        setInputModal(prev => ({ ...prev, isOpen: false }));
        setConfirmationModal({
          isOpen: true,
          type: 'success',
          title: 'Deposit Rejected',
          message: 'Deposit has been rejected successfully.',
          confirmText: 'OK',
          onConfirm: () => {
            setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            fetchDeposits(); // Refresh the list
          },
          loading: false
        });
      } else {
        const error = await response.json();
        // Close input modal and show error confirmation
        setInputModal(prev => ({ ...prev, isOpen: false }));
        setConfirmationModal({
          isOpen: true,
          type: 'danger',
          title: 'Rejection Failed',
          message: error.error || 'Failed to reject deposit. Please try again.',
          confirmText: 'OK',
          onConfirm: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
          loading: false
        });
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      // Close input modal and show error confirmation
      setInputModal(prev => ({ ...prev, isOpen: false }));
      setConfirmationModal({
        isOpen: true,
        type: 'danger',
        title: 'Error',
        message: 'An error occurred while rejecting the deposit. Please try again.',
        confirmText: 'OK',
        onConfirm: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
        loading: false
      });
    }
  };

  const handleImageClick = (deposit: Deposit) => {
    if (deposit.media_url) {
      const token = localStorage.getItem('token');
      const imageUrl = `/api${deposit.media_url}?token=${token}`;
      setImagePreviewModal({
        isOpen: true,
        imageUrl,
        imageTitle: `Payment Proof - ${deposit.first_name} ${deposit.last_name} (${deposit.mtr_number || 'No MTR'})`,
        deposit
      });
    }
  };

  const handleImageDownload = () => {
    if (imagePreviewModal.deposit && imagePreviewModal.deposit.media_url) {
      const token = localStorage.getItem('token');
      const downloadUrl = `/api${imagePreviewModal.deposit.media_url}?token=${token}`;
      const filename = imagePreviewModal.deposit.media_filename || `deposit-proof-${imagePreviewModal.deposit.id}.jpg`;
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const closeImagePreviewModal = () => {
    setImagePreviewModal({
      isOpen: false,
      imageUrl: '',
      imageTitle: '',
      deposit: null
    });
  };

  const handleUpdateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeposit) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/deposits/${selectedDeposit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setShowModal(false);
        setSelectedDeposit(null);
        fetchDeposits();
      } else {
        const error = await response.json();
        alert(error.error || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating deposit:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'verification':
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
      case 'completed':
        return <CheckIcon className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XMarkIcon className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (loading && deposits.length === 0) {
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
          <h1 className="text-2xl font-semibold text-gray-900">Deposit Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and process customer deposit requests.
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
            <option value="all">All Deposits</option>
            <option value="pending">Pending</option>
            <option value="verification">Under Verification</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Deposits Table */}
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
                      Payment Proof
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved At
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deposits.map((deposit) => (
                    <tr key={deposit.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {deposit.first_name} {deposit.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{deposit.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {deposit.currency_symbol}{parseFloat(deposit.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {deposit.mtr_number || 'Not provided'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {deposit.media_url ? (
                          <img
                            src={`/api${deposit.media_url}?token=${localStorage.getItem('token')}`}
                            alt="Payment proof"
                            className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-75"
                            onClick={() => handleImageClick(deposit)}
                            title="Click to view full image"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <PhotoIcon className="w-6 h-6 text-gray-400" />
                            <span className="sr-only">No image</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}>
                            {getStatusIcon(deposit.status)}
                            <span className="ml-1 capitalize">{deposit.status}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="text-xs">
                          {formatTableTimestamp(deposit.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="text-xs">
                          {deposit.approved_at ? formatTableTimestamp(deposit.approved_at) : (
                            <span className="text-gray-400">Not approved</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {deposit.status === 'pending' || deposit.status === 'verification' ? (
                            <>
                              <button
                                onClick={() => handleApproveDeposit(deposit)}
                                className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                                title="Approve deposit"
                                disabled={loading}
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRejectDeposit(deposit)}
                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                title="Reject deposit"
                                disabled={loading}
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              {deposit.status === 'completed' ? 'Approved' : 'Rejected'}
                            </span>
                          )}
                        </div>
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

      {/* Deposit Details Modal */}
      {showModal && selectedDeposit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Deposit Request Details
              </h3>
              
              {/* Customer Info */}
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                <p className="text-sm text-gray-600">
                  <strong>Name:</strong> {selectedDeposit.first_name} {selectedDeposit.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {selectedDeposit.email}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Amount:</strong> {selectedDeposit.currency_symbol}{parseFloat(selectedDeposit.amount).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>MTR Number:</strong> {selectedDeposit.mtr_number || 'Not provided'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Created:</strong> {new Date(selectedDeposit.created_at).toLocaleString()}
                </p>
                {selectedDeposit.approved_at && (
                  <p className="text-sm text-gray-600">
                    <strong>Approved:</strong> {new Date(selectedDeposit.approved_at).toLocaleString()}
                  </p>
                )}
                {selectedDeposit.processed_by_name && (
                  <p className="text-sm text-gray-600">
                    <strong>Processed by:</strong> {selectedDeposit.processed_by_name} {selectedDeposit.processed_by_lastname}
                  </p>
                )}
              </div>

              <form onSubmit={handleUpdateDeposit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="verification">Under Verification</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                  <textarea
                    rows={3}
                    value={updateData.admin_notes}
                    onChange={(e) => setUpdateData({ ...updateData, admin_notes: e.target.value })}
                    placeholder="Add notes about this deposit request..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedDeposit(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Deposit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        type={confirmationModal.type}
        loading={confirmationModal.loading}
      />

      {/* Beautiful Input Modal for Rejection Reason */}
      <InputModal
        isOpen={inputModal.isOpen}
        onClose={() => setInputModal(prev => ({ ...prev, isOpen: false }))}
        onSubmit={inputModal.onSubmit}
        title={inputModal.title}
        message={inputModal.message}
        placeholder={inputModal.placeholder}
        confirmText={inputModal.confirmText}
        type={inputModal.type}
        loading={inputModal.loading}
        multiline={true}
        maxLength={500}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewModal.isOpen}
        onClose={closeImagePreviewModal}
        imageUrl={imagePreviewModal.imageUrl}
        imageTitle={imagePreviewModal.imageTitle}
        onDownload={handleImageDownload}
      />
    </div>
  );
}
