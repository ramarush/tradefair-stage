'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Campaign {
  id: number;
  campaign_name: string;
  campaign_id: string;
  user_recurrence: number;
  percentage_bonus: number;
  bonus_type: string;
  target_user_type: string;
  target_user_ids: number[];
  is_active: boolean;
  start_date_time: string;
  end_date_time: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
}

export default function MarketingSettingsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [formData, setFormData] = useState({
    campaign_name: '',
    campaign_id: '',
    user_recurrence: 1,
    percentage_bonus: 0,
    bonus_type: 'every_deposit',
    target_user_type: 'all_users',
    target_user_ids: [] as number[],
    is_active: true,
    start_date_time: '',
    end_date_time: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // User search states
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterActive !== 'all') {
        params.append('isActive', filterActive);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/campaigns?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns);
      } else {
        console.error('Failed to fetch campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  }, [filterActive, searchTerm]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Debounced user search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearchTerm) {
        searchUsers(userSearchTerm);
      } else {
        setSearchedUsers([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchTerm]);

  const handleSearch = () => {
    fetchCampaigns();
  };

  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchedUsers([]);
      return;
    }

    setUserSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users?page=1&limit=10&search=${encodeURIComponent(searchTerm)}&status=all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchedUsers(data.users);
      } else {
        console.error('Failed to search users');
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setUserSearchLoading(false);
    }
  };

  const addSelectedUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      const newSelectedUsers = [...selectedUsers, user];
      setSelectedUsers(newSelectedUsers);
      setFormData({
        ...formData,
        target_user_ids: newSelectedUsers.map(u => u.id)
      });
    }
    setUserSearchTerm('');
    setSearchedUsers([]);
  };

  const removeSelectedUser = (userId: number) => {
    const newSelectedUsers = selectedUsers.filter(u => u.id !== userId);
    setSelectedUsers(newSelectedUsers);
    setFormData({
      ...formData,
      target_user_ids: newSelectedUsers.map(u => u.id)
    });
  };

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setFormData({
      campaign_name: '',
      campaign_id: '',
      user_recurrence: 1,
      percentage_bonus: 0,
      bonus_type: 'every_deposit',
      target_user_type: 'all_users',
      target_user_ids: [],
      is_active: true,
      start_date_time: '',
      end_date_time: ''
    });
    setSelectedUsers([]);
    setUserSearchTerm('');
    setSearchedUsers([]);
    setShowModal(true);
  };

  const handleEditCampaign = async (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      campaign_name: campaign.campaign_name,
      campaign_id: campaign.campaign_id,
      user_recurrence: campaign.user_recurrence,
      percentage_bonus: campaign.percentage_bonus,
      bonus_type: campaign.bonus_type,
      target_user_type: campaign.target_user_type,
      target_user_ids: campaign.target_user_ids,
      is_active: campaign.is_active,
      start_date_time: campaign.start_date_time.slice(0, 16), // Format for datetime-local input
      end_date_time: campaign.end_date_time.slice(0, 16)
    });

    // Load selected users if targeting specific users
    if (campaign.target_user_type === 'specific_users' && campaign.target_user_ids.length > 0) {
      try {
        const token = localStorage.getItem('token');
        const userPromises = campaign.target_user_ids.map(userId =>
          fetch(`/api/admin/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(res => res.ok ? res.json() : null)
        );
        
        const userResponses = await Promise.all(userPromises);
        const users = userResponses.filter(response => response?.user).map(response => response.user);
        setSelectedUsers(users);
      } catch (error) {
        console.error('Error loading selected users:', error);
        setSelectedUsers([]);
      }
    } else {
      setSelectedUsers([]);
    }

    setUserSearchTerm('');
    setSearchedUsers([]);
    setShowModal(true);
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/campaigns/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Campaign deleted successfully!');
        fetchCampaigns();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete campaign');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Network error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingCampaign 
        ? `/api/admin/campaigns/${editingCampaign.id}`
        : '/api/admin/campaigns';
      
      const method = editingCampaign ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`Campaign ${editingCampaign ? 'updated' : 'created'} successfully!`);
        setShowModal(false);
        fetchCampaigns();
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${editingCampaign ? 'update' : 'create'} campaign`);
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Network error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const isCampaignActive = (campaign: Campaign) => {
    const now = new Date();
    const start = new Date(campaign.start_date_time);
    const end = new Date(campaign.end_date_time);
    return campaign.is_active && now >= start && now <= end;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Marketing Settings
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Create and manage marketing campaigns with UTM tracking
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 mb-6 sm:px-0">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700"
                  >
                    Search
                  </button>
                </div>
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Campaigns</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>
              <button
                onClick={handleCreateCampaign}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="px-4 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Campaigns ({campaigns.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading campaigns...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User Recurrence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bonus %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bonus Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Schedule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {campaigns.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          No campaigns found
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {campaign.campaign_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Created: {formatDateTime(campaign.created_at)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {campaign.campaign_id}
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {campaign.user_recurrence}x
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {campaign.percentage_bonus}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              campaign.bonus_type === 'first_deposit_only' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {campaign.bonus_type === 'first_deposit_only' ? 'First Deposit' : 'Every Deposit'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-col space-y-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                campaign.target_user_type === 'all_users' 
                                  ? 'bg-gray-100 text-gray-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {campaign.target_user_type === 'all_users' ? 'All Users' : 'Specific Users'}
                              </span>
                              {campaign.target_user_type === 'specific_users' && (
                                <span className="text-xs text-gray-500">
                                  {campaign.target_user_ids.length} user{campaign.target_user_ids.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              {getStatusBadge(campaign.is_active)}
                              {isCampaignActive(campaign) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Running
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <div>Start: {formatDateTime(campaign.start_date_time)}</div>
                              <div>End: {formatDateTime(campaign.end_date_time)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditCampaign(campaign)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(campaign.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.campaign_name}
                    onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., Summer Sale 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Campaign ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.campaign_id}
                    onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., summer_sale_2024"
                  />
                  <p className="mt-1 text-xs text-gray-500">Unique identifier for UTM tracking</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">User Recurrence</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.user_recurrence}
                    onChange={(e) => setFormData({ ...formData, user_recurrence: parseInt(e.target.value) || 1 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">How many times a user can avail this campaign</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bonus Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.percentage_bonus}
                    onChange={(e) => setFormData({ ...formData, percentage_bonus: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., 10.5"
                  />
                  <p className="mt-1 text-xs text-gray-500">Bonus percentage to credit on completed deposits (0-100%)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bonus Type</label>
                  <div className="mt-2 space-y-2 flex flex-col gap-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="bonusType"
                        value="every_deposit"
                        checked={formData.bonus_type === 'every_deposit'}
                        onChange={(e) => setFormData({ ...formData, bonus_type: e.target.value })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <label className="ml-2 text-sm text-gray-900">Every Deposit</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="bonusType"
                        value="first_deposit_only"
                        checked={formData.bonus_type === 'first_deposit_only'}
                        onChange={(e) => setFormData({ ...formData, bonus_type: e.target.value })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <label className="ml-2 text-sm text-gray-900">First Deposit Only</label>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Choose when to award bonuses to users</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Users</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="targetUserType"
                        value="all_users"
                        checked={formData.target_user_type === 'all_users'}
                        onChange={(e) => {
                          setFormData({ ...formData, target_user_type: e.target.value, target_user_ids: [] });
                          setSelectedUsers([]);
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <label className="ml-2 text-sm text-gray-900">All Users</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="targetUserType"
                        value="specific_users"
                        checked={formData.target_user_type === 'specific_users'}
                        onChange={(e) => setFormData({ ...formData, target_user_type: e.target.value })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <label className="ml-2 text-sm text-gray-900">Specific Users</label>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Choose whether to target all users or specific users</p>

                  {formData.target_user_type === 'specific_users' && (
                    <div className="mt-4 space-y-3">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700">Search Users</label>
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          placeholder="Search by name or email..."
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        
                        {/* Search Results Dropdown */}
                        {searchedUsers.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {searchedUsers.map((user) => (
                              <div
                                key={user.id}
                                onClick={() => addSelectedUser(user)}
                                className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {userSearchLoading && (
                          <div className="absolute right-3 top-8 text-gray-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                          </div>
                        )}
                      </div>

                      {/* Selected Users */}
                      {selectedUsers.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selected Users ({selectedUsers.length})
                          </label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedUsers.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                              >
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSelectedUser(user.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.start_date_time}
                      onChange={(e) => setFormData({ ...formData, start_date_time: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.end_date_time}
                      onChange={(e) => setFormData({ ...formData, end_date_time: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Campaign is active
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
