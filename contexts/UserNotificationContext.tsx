'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNotifications } from './NotificationContext';
import { useWebSocket } from '@/hooks/useWebSocket';

interface UserNotificationContextType {
  isConnected: boolean;
  hasNotificationPermission: boolean;
  requestAudioPermission: () => Promise<void>;
}

interface UserNotificationProviderProps {
  children: React.ReactNode;
  onDataUpdate?: () => void;
}

const UserNotificationContext = createContext<UserNotificationContextType | undefined>(undefined);

export const useUserNotifications = () => {
  const context = useContext(UserNotificationContext);
  if (context === undefined) {
    throw new Error('useUserNotifications must be used within a UserNotificationProvider');
  }
  return context;
};

export const UserNotificationProvider: React.FC<UserNotificationProviderProps> = ({ children, onDataUpdate }) => {
  const { addNotification } = useNotifications();
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

  const playNotificationSound = async () => {
    if (hasNotificationPermission && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.7;
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing notification sound:', error);
        setHasNotificationPermission(false);
      }
    }
  };

  // WebSocket integration with transaction handling
  const { isConnected } = useWebSocket({
    token,
    onConnect: () => {
      console.log('User WebSocket connected');
    },
    onDisconnect: () => {
      console.log('User WebSocket disconnected');
    },
    onError: (error) => {
      console.error('User WebSocket error:', error);
    },
    onTransactionUpdate: async (data: any) => {
      console.log('User received transaction update:', data);
      
      // Add notification for user's own transactions
      const transaction = data.data;
      let message = '';
      
      // Determine transaction type from payment_method_id
      const transactionType = transaction.payment_method_id ? 'deposit' : 'withdrawal';
      
      if (transactionType === 'deposit') {
        if (transaction.status === 'completed') {
          message = `Your deposit of ₹${transaction.amount} has been approved!`;
        } else if (transaction.status === 'rejected') {
          message = `Your deposit of ₹${transaction.amount} has been rejected.`;
        }
      } else if (transactionType === 'withdrawal') {
        if (transaction.status === 'completed') {
          message = `Your withdrawal of ₹${transaction.amount} has been approved!`;
        } else if (transaction.status === 'rejected') {
          message = `Your withdrawal of ₹${transaction.amount} has been rejected.`;
        }
      }
      
      if (message) {
        addNotification({
          type: transactionType,
          message: message
        });

        // Play notification sound if permission granted
        if (hasNotificationPermission) {
          await playNotificationSound();
        }

        // Trigger dashboard data refresh
        if (onDataUpdate) {
          onDataUpdate();
        }
      }
    }
  });

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.preload = 'auto';

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const requestAudioPermission = async () => {
    if (audioRef.current) {
      try {
        audioRef.current.volume = 0;
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.volume = 0.7;
        setHasNotificationPermission(true);
        console.log('Audio permission granted!');
      } catch (error) {
        console.error('Error requesting audio permission:', error);
        setHasNotificationPermission(false);
      }
    }
  };

  const value: UserNotificationContextType = {
    isConnected,
    hasNotificationPermission,
    requestAudioPermission,
  };

  return (
    <UserNotificationContext.Provider value={value}>
      {children}
    </UserNotificationContext.Provider>
  );
};
