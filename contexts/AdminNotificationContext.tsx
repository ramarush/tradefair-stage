'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNotifications } from './NotificationContext';
import { useWebSocket } from '@/hooks/useWebSocket';

interface AdminRealTimeData {
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  lastDepositId?: number;
  lastWithdrawalId?: number;
}

interface AdminNotificationContextType {
  data: AdminRealTimeData;
  isLoading: boolean;
  hasNotificationPermission: boolean;
  isConnected: boolean;
  refetch: () => Promise<void>;
  requestAudioPermission: () => Promise<void>;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext);
  if (context === undefined) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
  }
  return context;
};

export const AdminNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification } = useNotifications();
  const [data, setData] = useState<AdminRealTimeData>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [token, setToken] = useState<string>('');

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Handle transaction updates from WebSocket
  const handleAdminTransactionUpdate = async (data: any) => {
    console.log('Admin received transaction update:', data);
    console.log('hasNotificationPermission:', hasNotificationPermission);
    
    // Always refresh admin data first when any transaction change occurs
    await fetchRealTimeData();
    
    // Only add notification for new transactions (INSERT events)
    if (data.event === 'INSERT') {
      const transaction = data.data;
      let message = '';
      
      // Determine transaction type from payment_method_id or other fields
      const transactionType = transaction.payment_method_id ? 'deposit' : 'withdrawal';
      
      if (transactionType === 'deposit') {
        message = `New deposit request: ₹${transaction.amount} from user ${transaction.user_id}`;
      } else if (transactionType === 'withdrawal') {
        message = `New withdrawal request: ₹${transaction.amount} from user ${transaction.user_id}`;
      }
      
      console.log('Adding notification:', { type: transactionType, message });
      
      if (message) {
        // Call the realtime API to get updated stats and generate notifications
        await fetchAndProcessRealTimeData(transactionType, message);

        // Play notification sound ONLY if permission is granted
        console.log('Checking audio permission before playing sound:', hasNotificationPermission);
        if (hasNotificationPermission) {
          console.log('Playing notification sound...');
          await playNotificationSound();
        } else {
          console.log('Audio permission not granted, skipping sound');
        }
      }
    }
  };

  // WebSocket integration
  const { isConnected } = useWebSocket({
    token,
    onAdminTransactionUpdate: handleAdminTransactionUpdate,
    onConnect: () => {
      console.log('Admin WebSocket connected');
      setIsLoading(false);
    },
    onDisconnect: () => {
      console.log('Admin WebSocket disconnected');
    },
    onError: (error) => {
      console.error('Admin WebSocket error:', error);
      setIsLoading(false);
    }
  });

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.preload = 'auto';
    
    // Ensure audio permission starts as false
    setHasNotificationPermission(false);
    console.log('Audio initialized, permission set to false');

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const requestAudioPermission = async () => {
    console.log('requestAudioPermission called');
    if (audioRef.current) {
      try {
        // Test audio playback to request permission
        audioRef.current.volume = 0;
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.volume = 0.7;
        setHasNotificationPermission(true);
        console.log('Audio permission granted and state updated!');
      } catch (error) {
        console.error('Error requesting audio permission:', error);
        setHasNotificationPermission(false);
      }
    } else {
      console.log('Audio ref not available');
    }
  };

  const playNotificationSound = async () => {
    console.log('playNotificationSound called, hasNotificationPermission:', hasNotificationPermission);
    console.log('audioRef.current exists:', !!audioRef.current);
    
    if (hasNotificationPermission && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.7;
        console.log('Actually playing sound...');
        await audioRef.current.play();
        console.log('Sound played successfully');
      } catch (error) {
        console.error('Error playing notification sound:', error);
        setHasNotificationPermission(false);
      }
    } else {
      console.log('Sound not played - permission:', hasNotificationPermission, 'audio exists:', !!audioRef.current);
    }
  };

  const fetchRealTimeData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/realtime-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const newData: AdminRealTimeData = await response.json();
        setData(newData);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setIsLoading(false);
    }
  };

  const fetchAndProcessRealTimeData = async (transactionType: string, message: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('Fetching realtime data after WebSocket notification...');
      const response = await fetch('/api/admin/realtime-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const newData: AdminRealTimeData = await response.json();
        const oldData = data;
        
        // Check for changes and add notifications like the old polling system
        let hasNewNotification = false;
        
        // Check for new deposits
        if (newData.lastDepositId && newData.lastDepositId > (oldData.lastDepositId || 0)) {
          addNotification({
            type: 'deposit',
            message: `New deposit request received! Total pending: ${newData.pendingDeposits}`,
          });
          hasNewNotification = true;
        }

        // Check for new withdrawals
        if (newData.lastWithdrawalId && newData.lastWithdrawalId > (oldData.lastWithdrawalId || 0)) {
          addNotification({
            type: 'withdrawal',
            message: `New withdrawal request received! Total pending: ${newData.pendingWithdrawals}`,
          });
          hasNewNotification = true;
        }

        // Update the data
        setData(newData);
        setIsLoading(false);
        
        console.log('Realtime data updated:', newData);
        console.log('New notification added:', hasNewNotification);
      }
    } catch (error) {
      console.error('Error fetching and processing real-time data:', error);
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (token) {
      fetchRealTimeData();
    }
  }, [token]);

  const value: AdminNotificationContextType = {
    data,
    isLoading,
    hasNotificationPermission,
    isConnected,
    refetch: fetchRealTimeData,
    requestAudioPermission,
  };

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
    </AdminNotificationContext.Provider>
  );
};
