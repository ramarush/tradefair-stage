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

export const useAdminRealTimeUpdates = () => {
  const { addNotification } = useNotifications();
  const [data, setData] = useState<RealTimeData>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<RealTimeData | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fastPollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pollingInterval, setPollingInterval] = useState(10000); // Default 10 seconds

  // Initialize audio and request permissions
  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.preload = 'auto';

    // Request audio permission
    const requestAudioPermission = async () => {
      try {
        // Try to play a silent audio to request permission
        const testAudio = new Audio();
        testAudio.volume = 0;
        await testAudio.play();
        testAudio.pause();
        setHasNotificationPermission(true);
      } catch (error) {
        console.log('Audio permission not granted yet');
        // Request permission on user interaction
        const requestPermission = () => {
          if (audioRef.current) {
            audioRef.current.volume = 0;
            audioRef.current.play().then(() => {
              audioRef.current!.pause();
              audioRef.current!.volume = 0.7;
              setHasNotificationPermission(true);
              document.removeEventListener('click', requestPermission);
              document.removeEventListener('keydown', requestPermission);
            }).catch(console.error);
          }
        };
        
        document.addEventListener('click', requestPermission);
        document.addEventListener('keydown', requestPermission);
      }
    };

    requestAudioPermission();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = async () => {
    if (hasNotificationPermission && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.7;
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    }
  };

  const switchToFastPolling = () => {
    console.log('Switching to fast polling (3 seconds) due to notification');
    setPollingInterval(3000);
    
    // Reset to normal polling after 2 minutes
    if (fastPollingTimeoutRef.current) {
      clearTimeout(fastPollingTimeoutRef.current);
    }
    
    fastPollingTimeoutRef.current = setTimeout(() => {
      console.log('Switching back to normal polling (10 seconds)');
      setPollingInterval(10000);
    }, 120000); // 2 minutes
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
        const newData: RealTimeData = await response.json();
        let hasNewNotification = false;
        
        // Check for new deposits
        if (lastDataRef.current && newData.lastDepositId && 
            newData.lastDepositId > (lastDataRef.current.lastDepositId || 0)) {
          addNotification({
            type: 'deposit',
            message: `New deposit request received! Total pending: ${newData.pendingDeposits}`,
          });
          hasNewNotification = true;
        }

        // Check for new withdrawals
        if (lastDataRef.current && newData.lastWithdrawalId && 
            newData.lastWithdrawalId > (lastDataRef.current.lastWithdrawalId || 0)) {
          addNotification({
            type: 'withdrawal',
            message: `New withdrawal request received! Total pending: ${newData.pendingWithdrawals}`,
          });
          hasNewNotification = true;
        }

        // If there's a new notification, play sound and switch to fast polling
        if (hasNewNotification) {
          await playNotificationSound();
          switchToFastPolling();
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
    
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up polling with current interval
    intervalRef.current = setInterval(fetchRealTimeData, pollingInterval);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (fastPollingTimeoutRef.current) {
      clearTimeout(fastPollingTimeoutRef.current);
      fastPollingTimeoutRef.current = null;
    }
  };

  // Restart polling when interval changes
  useEffect(() => {
    if (!isLoading) {
      startPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [pollingInterval]);

  // Initial polling setup
  useEffect(() => {
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  return {
    data,
    isLoading,
    hasNotificationPermission,
    pollingInterval,
    refetch: fetchRealTimeData,
    startPolling,
    stopPolling,
  };
};
