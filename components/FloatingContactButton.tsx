'use client';

import { useState } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FaWhatsapp, FaTelegram, FaFacebookMessenger } from 'react-icons/fa';
import { SiTelegram } from 'react-icons/si';

const FloatingContactButton = () => {
  const handleClick = () => {
      window.open("https://linktr.ee/tradefairofficial", "_blank", "noopener,noreferrer");
    };
  
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {/* Direct Link Button */}
        <button
          onClick={handleClick}
          style={{ zIndex: 9999, position: 'relative' }}
          className="w-18 h-18 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform duration-300"
        >
          <ChatBubbleLeftRightIcon className='w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' />
        </button>
      </div>
    );
};

export default FloatingContactButton;
