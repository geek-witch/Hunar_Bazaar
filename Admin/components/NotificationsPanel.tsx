
import React from 'react';
import { AppNotification } from '../types';
import { X, Check, Bell, AlertCircle, MessageSquare, Info } from 'lucide-react';

interface NotificationsPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onClose, onMarkAllRead }) => {
  
  const getIcon = (type: string) => {
    switch(type) {
      case 'Dispute': return <AlertCircle size={20} className="text-red-500" />;
      case 'Query': return <MessageSquare size={20} className="text-blue-500" />;
      default: return <Info size={20} className="text-[#0E4B5B]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Panel */}
      <div className="relative w-full max-w-md bg-[#E6EEF9] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-blue-200">
        
        {/* Header */}
        <div className="p-5 border-b border-blue-200 bg-white/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-[#0E4B5B]" />
            <h2 className="text-lg font-bold text-[#0E4B5B]">Notifications</h2>
            <span className="bg-[#0E4B5B] text-white text-xs px-2 py-0.5 rounded-full">
              {notifications.filter(n => !n.isRead).length} New
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>No new notifications</p>
            </div>
          ) : (
            notifications.map((note) => (
              <div 
                key={note.id} 
                className={`p-4 rounded-xl border transition-all ${
                  note.isRead 
                    ? 'bg-white border-blue-100 opacity-70' 
                    : 'bg-white border-[#0E4B5B] shadow-md border-l-4'
                }`}
              >
                <div className="flex gap-3">
                  <div className={`mt-1 p-2 rounded-full h-fit ${
                    note.type === 'Dispute' ? 'bg-red-50' : note.type === 'Query' ? 'bg-blue-50' : 'bg-teal-50'
                  }`}>
                    {getIcon(note.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-sm font-bold ${note.isRead ? 'text-gray-700' : 'text-[#0E4B5B]'}`}>
                        {note.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{note.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {note.message}
                    </p>
                    <div className="mt-2 flex justify-end">
                       <span className="text-[10px] uppercase font-bold tracking-wide text-gray-400 border border-gray-200 px-2 py-0.5 rounded">
                         {note.type}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blue-200 bg-white/50">
          <button 
            onClick={onMarkAllRead}
            className="w-full py-3 bg-[#0E4B5B] hover:bg-[#093540] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Check size={16} /> Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
};
