import React, { useState } from 'react';
import { AppNotification } from '../types';
import { X, Check, Bell, AlertCircle, MessageSquare, Info } from 'lucide-react';

interface NotificationsPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications: initialNotifications,
  onClose,
  onMarkAllRead
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Dispute': return <AlertCircle size={20} className="text-red-500" />;
      case 'Query': return <MessageSquare size={20} className="text-blue-500" />;
      default: return <Info size={20} className="text-[#0E4B5B]" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
              {unreadCount} New
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
            notifications.map(note => (
              <div key={note.id} className={`bg-white rounded-xl shadow-sm p-4 transition-all hover:shadow-md flex gap-3 ${
                !note.isRead ? 'border-l-4 border-[#0E4B5B]' : 'border border-blue-100 opacity-70'
              }`}>
                
                {/* Icon */}
                <div className={`shrink-0 mt-1 p-2 rounded-full h-fit ${
                  note.type === 'Dispute' ? 'bg-red-50' : note.type === 'Query' ? 'bg-blue-50' : 'bg-teal-50'
                }`}>
                  {getIcon(note.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-sm font-bold ${note.isRead ? 'text-gray-700' : 'text-[#0E4B5B]'}`}>
                      {note.title}
                    </h4>
                    {!note.isRead && <span className="w-2 h-2 bg-[#0E4B5B] rounded-full mt-1.5 shrink-0"></span>}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{note.message}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold tracking-wide text-gray-400 border border-gray-200 px-2 py-0.5 rounded">
                      {note.type}
                    </span>
                    <span className="text-[10px] text-gray-400">{note.time}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex flex-col gap-2">
                  {!note.isRead && (
                    <button
                      onClick={() => markAsRead(note.id)}
                      className="text-[#0E4B5B] hover:text-teal-700 text-xs font-medium"
                      title="Mark as read"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(note.id)}
                    className="text-gray-400 hover:text-red-500 text-xs"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blue-200 bg-white/50">
          <button 
            onClick={() => {
              setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
              onMarkAllRead();
            }}
            className="w-full py-3 bg-[#0E4B5B] hover:bg-[#093540] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Check size={16} /> Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
};
