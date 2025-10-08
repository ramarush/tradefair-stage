'use client';

import { useAdminNotifications } from '../contexts/AdminNotificationContext';

export default function AdminGlobalStatus() {
  const { hasNotificationPermission, isConnected, requestAudioPermission } = useAdminNotifications();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
            }`}></div>
            <span className="text-xs font-medium text-gray-600">
              WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button 
            onClick={requestAudioPermission}
            className={`flex items-center space-x-2 px-2 py-1 rounded transition-colors ${
              hasNotificationPermission 
                ? 'hover:bg-green-50 cursor-default' 
                : 'hover:bg-yellow-50 cursor-pointer'
            }`}
            disabled={hasNotificationPermission}
          >
            <div className={`h-2 w-2 rounded-full ${
              hasNotificationPermission ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
            }`}></div>
            <span className="text-xs font-medium text-gray-600">
              Audio: {hasNotificationPermission ? 'Enabled' : 'Click to enable'}
            </span>
            {!hasNotificationPermission && (
              <span className="text-xs text-yellow-600">🔊</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
