import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketHookOptions {
  token: string;
  onTransactionUpdate?: (data: any) => void;
  onAdminTransactionUpdate?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

interface WebSocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

export const useWebSocket = (options: WebSocketHookOptions): WebSocketHookReturn => {
  const {
    token,
    onTransactionUpdate,
    onAdminTransactionUpdate,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
    
    const socket = io(wsUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      setError(null);
      onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      setError(err.message);
      setIsConnected(false);
      onError?.(err.message);
    });

    socket.on('connected', (data) => {
      console.log('WebSocket connection confirmed:', data);
    });

    // Handle transaction updates for regular users
    socket.on('transactionUpdateUser', (data) => {
      console.log('Transaction update received:', data);
      onTransactionUpdate?.(data);
    });

    // Handle transaction updates for admins
    socket.on('transactionUpdateAdmin', (data) => {
      console.log('Admin transaction update received:', data);
      onAdminTransactionUpdate?.(data);
    });

    socketRef.current = socket;
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const reconnect = () => {
    disconnect();
    connect();
  };

  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    reconnect
  };
};

export default useWebSocket;
