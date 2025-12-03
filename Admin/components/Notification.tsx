
import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface NotificationProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({ message, onClose, duration = 8000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 w-full max-w-sm px-4">
      <div className="bg-[#E6EEF9] border-l-4 border-[#0E4B5B] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 w-full relative">
        <div className="bg-[#0E4B5B]/10 p-2 rounded-full text-[#0E4B5B]">
          <CheckCircle size={24} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-[#0E4B5B] text-lg">System Message</p>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="bg-[#0E4B5B] text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-[#093540] transition-colors uppercase tracking-wide"
        >
          ok
        </button>
      </div>
    </div>
  );
};
