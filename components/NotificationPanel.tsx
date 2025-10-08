'use client';

import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline';
import { BanknotesIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';

const NotificationPanel: React.FC = () => {
  const { notifications, clearNotification, markAsRead, unreadCount } = useNotifications();

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hour12: false,
    }).format(timestamp);
  };

  const getIcon = (type: 'deposit' | 'withdrawal') => {
    return type === 'deposit' ? (
      <BanknotesIcon className="w-5 h-5 text-green-600" />
    ) : (
      <ArrowUpTrayIcon className="w-5 h-5 text-blue-600" />
    );
  };

  const getBgColor = (type: 'deposit' | 'withdrawal', isRead: boolean) => {
    if (isRead) return 'bg-gray-50';
    return type === 'deposit' ? 'bg-green-50' : 'bg-blue-50';
  };

  const getBorderColor = (type: 'deposit' | 'withdrawal') => {
    return type === 'deposit' ? 'border-l-green-500' : 'border-l-blue-500';
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <BellIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
        </div>
        <p className="text-gray-500 text-center py-4">No new notifications</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <BellIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border-b border-l-4 ${getBgColor(notification.type, notification.isRead)} ${getBorderColor(notification.type)} transition-colors duration-200`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getIcon(notification.type)}
                <div className="flex-1">
                  <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => clearNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPanel;
