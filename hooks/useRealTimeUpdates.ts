'use client';

import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

interface RealTimeData {
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  lastDepositId?: number;
  lastWithdrawalId?: number;
}

export const useRealTimeUpdates = () => {
  const { addNotification } = useNotifications();
  const [data, setData] = useState<RealTimeData>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<RealTimeData | null>(null);

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
        const newData: RealTimeData = await response.json();
        
        // Check for new deposits
        if (lastDataRef.current && newData.lastDepositId && 
            newData.lastDepositId > (lastDataRef.current.lastDepositId || 0)) {
          addNotification({
            type: 'deposit',
            message: `New deposit request received! Total pending: ${newData.pendingDeposits}`,
          });
        }

        // Check for new withdrawals
        if (lastDataRef.current && newData.lastWithdrawalId && 
            newData.lastWithdrawalId > (lastDataRef.current.lastWithdrawalId || 0)) {
          addNotification({
            type: 'withdrawal',
            message: `New withdrawal request received! Total pending: ${newData.pendingWithdrawals}`,
          });
        }

        lastDataRef.current = newData;
        setData(newData);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setIsLoading(false);
    }
  };

  const startPolling = () => {
    // Initial fetch
    fetchRealTimeData();
    
    // Set up polling every 5 seconds
    intervalRef.current = setInterval(fetchRealTimeData, 5000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  return {
    data,
    isLoading,
    refetch: fetchRealTimeData,
    startPolling,
    stopPolling,
  };
};
