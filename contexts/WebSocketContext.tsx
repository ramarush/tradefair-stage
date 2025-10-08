'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface WebSocketContextType {
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
  token?: string;
  onTransactionUpdate?: (data: any) => void;
  onAdminTransactionUpdate?: (data: any) => void;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  token,
  onTransactionUpdate,
  onAdminTransactionUpdate
}) => {
  const [shouldConnect, setShouldConnect] = useState(false);

  // Only connect if we have a token
  useEffect(() => {
    setShouldConnect(!!token);
  }, [token]);

  const { isConnected, error, reconnect } = useWebSocket({
    token: token || '',
    onTransactionUpdate,
    onAdminTransactionUpdate,
    onConnect: () => {
      console.log('WebSocket connected successfully');
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  const contextValue: WebSocketContextType = {
    isConnected: shouldConnect ? isConnected : false,
    error,
    reconnect
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
