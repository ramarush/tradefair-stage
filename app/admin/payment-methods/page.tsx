'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '@/components/ConfirmationModal';

interface PaymentMethod {
  id: number;
  type: 'bank' | 'upi';
  account_holder_name: string;
  min_amount: number;
  max_amount: number;
  min_transactions_required: number;
  expiration_time_minutes: number;
  is_active: boolean;
  // Bank fields
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  // UPI fields
  vpa_address?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentMethodFormData {
  type: 'bank' | 'upi';
  account_holder_name: string;
  min_amount: number;
  max_amount: number;
  min_transactions_required: number;
  expiration_time_minutes: number;
  // Bank fields
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  // UPI fields
  vpa_address?: string;
}

export default function PaymentMethodsManagement() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    type: 'bank',
    account_holder_name: '',
    min_amount: 1,
    max_amount: 1000000,
    min_transactions_required: 0,
    expiration_time_minutes: 30,
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    vpa_address: '',
  });

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'danger' | 'warning' | 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, [typeFilter, activeFilter]);

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (activeFilter !== 'all') params.append('active', activeFilter);

      const response = await fetch(`/api/admin/payment-methods?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = isEditing && selectedMethod 
        ? `/api/admin/payment-methods/${selectedMethod.id}`
        : '/api/admin/payment-methods';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        fetchPaymentMethods();
        resetForm();
        setConfirmationModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: `Payment method ${isEditing ? 'updated' : 'created'} successfully!`,
          onConfirm: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
          onCancel: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
        });
      } else {
        const errorData = await response.json();
        setConfirmationModal({
          isOpen: true,
          type: 'danger',
          title: 'Error',
          message: errorData.error || 'Failed to save payment method',
          onConfirm: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
          onCancel: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
        });
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setIsEditing(true);
    setFormData({
      type: method.type,
      account_holder_name: method.account_holder_name,
      min_amount: method.min_amount,
      max_amount: method.max_amount,
      min_transactions_required: method.min_transactions_required,
      expiration_time_minutes: method.expiration_time_minutes,
      account_number: method.account_number || '',
      ifsc_code: method.ifsc_code || '',
      bank_name: method.bank_name || '',
      vpa_address: method.vpa_address || '',
    });
    setShowModal(true);
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    setConfirmationModal({
      isOpen: true,
      type: 'warning',
      title: `${method.is_active ? 'Deactivate' : 'Activate'} Payment Method`,
      message: `Are you sure you want to ${method.is_active ? 'deactivate' : 'activate'} this payment method?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const response = await fetch(`/api/admin/payment-methods/${method.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ is_active: !method.is_active }),
          });

          if (response.ok) {
            fetchPaymentMethods();
            setConfirmationModal(prev => ({ ...prev, isOpen: false }));
          }
        } catch (error) {
          console.error('Error toggling payment method status:', error);
        }
      },
      onCancel: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  const handleDelete = (method: PaymentMethod) => {
    setConfirmationModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete Payment Method',
      message: 'Are you sure you want to delete this payment method? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const response = await fetch(`/api/admin/payment-methods/${method.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            fetchPaymentMethods();
            setConfirmationModal(prev => ({ ...prev, isOpen: false }));
          } else {
            const errorData = await response.json();
            setConfirmationModal({
              isOpen: true,
              type: 'danger',
              title: 'Error',
              message: errorData.error || 'Failed to delete payment method',
              onConfirm: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
              onCancel: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
            });
          }
        } catch (error) {
          console.error('Error deleting payment method:', error);
        }
      },
      onCancel: () => setConfirmationModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  const resetForm = () => {
    setFormData({
      type: 'bank',
      account_holder_name: '',
      min_amount: 1,
      max_amount: 1000000,
      min_transactions_required: 0,
      expiration_time_minutes: 30,
      account_number: '',
      ifsc_code: '',
      bank_name: '',
      vpa_address: '',
    });
    setSelectedMethod(null);
    setIsEditing(false);
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Methods Management</h1>
        <p className="text-gray-600">Manage bank and UPI payment methods for deposits</p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Types</option>
            <option value="bank">Bank</option>
            <option value="upi">UPI</option>
          </select>
          
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Payment Method
        </button>
      </div>

      {/* Payment Methods Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Holder</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Range</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Transactions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paymentMethods.map((method) => (
              <tr key={method.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    method.type === 'bank' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {method.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {method.account_holder_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {method.type === 'bank' ? (
                    <div>
                      <div>{method.bank_name}</div>
                      <div className="text-xs">{method.account_number}</div>
                      <div className="text-xs">{method.ifsc_code}</div>
                    </div>
                  ) : (
                    <div>{method.vpa_address}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₹{method.min_amount} - ₹{method.max_amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {method.min_transactions_required}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {method.expiration_time_minutes}m
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    method.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {method.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(method)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(method)}
                    className={method.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                  >
                    {method.is_active ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(method)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paymentMethods.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No payment methods found.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? 'Edit Payment Method' : 'Add New Payment Method'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'bank' | 'upi' })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      disabled={isEditing}
                    >
                      <option value="bank">Bank</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={formData.account_holder_name}
                      onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.min_amount}
                      onChange={(e) => setFormData({ ...formData, min_amount: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                    <input
                      type="number"
                      min={formData.min_amount + 1}
                      value={formData.max_amount}
                      onChange={(e) => setFormData({ ...formData, max_amount: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Transactions Required</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.min_transactions_required}
                      onChange={(e) => setFormData({ ...formData, min_transactions_required: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Time (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.expiration_time_minutes}
                      onChange={(e) => setFormData({ ...formData, expiration_time_minutes: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                </div>

                {/* Type-specific fields */}
                {formData.type === 'bank' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={formData.ifsc_code}
                        onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI VPA Address</label>
                    <input
                      type="text"
                      value={formData.vpa_address}
                      onChange={(e) => setFormData({ ...formData, vpa_address: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="example@upi"
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isEditing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        onCancel={confirmationModal.onCancel}
        type={confirmationModal.type}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />
    </div>
  );
}