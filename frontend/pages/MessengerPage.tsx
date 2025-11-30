import React, { useState } from 'react';
import { Navigation } from '../App';
import { SearchIcon } from '../components/icons/MiscIcons';

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

const MessengerPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [chats] = useState<Chat[]>([
    {
      id: '1',
      name: 'Ayesha Rana',
      avatar: '/asset/p1.jfif',
      lastMessage: 'Hi! I would love to learn React from you.',
      time: '2m',
      unread: 2,
      online: true
    },
    {
      id: '2',
      name: 'Ali Khan',
      avatar: '/asset/p2.png',
      lastMessage: 'Thanks for the Python session!',
      time: '1h',
      unread: 0,
      online: true
    },
    {
      id: '3',
      name: 'Jaweria Rehman',
      avatar: '/asset/p3.jpg',
      lastMessage: 'Can we schedule for tomorrow?',
      time: '3h',
      unread: 1,
      online: false
    },
    {
      id: '4',
      name: 'Ahmad Khan',
      avatar: '/asset/p4.jpg',
      lastMessage: 'Great session on databases!',
      time: '1d',
      unread: 0,
      online: false
    }
  ]);

  const [selectedChat, setSelectedChat] = useState<string | null>('1');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey! I saw your profile and I\'m interested in learning React.',
      sender: 'other',
      time: '10:30 AM'
    },
    {
      id: '2',
      text: 'Hi Ayesha! I\'d be happy to help you with React.',
      sender: 'me',
      time: '10:32 AM'
    },
    {
      id: '3',
      text: 'That\'s great! When would be a good time for you?',
      sender: 'other',
      time: '10:35 AM'
    },
    {
      id: '4',
      text: 'How about tomorrow at 3 PM?',
      sender: 'me',
      time: '10:37 AM'
    },
    {
      id: '5',
      text: 'Perfect! Looking forward to it. 😊',
      sender: 'other',
      time: '10:38 AM'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const selectedChatData = chats.find(c => c.id === selectedChat);
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-brand-light-blue min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold text-brand-teal mb-6">Messages</h1>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Sidebar - Chat List */}
            <div className={`w-full sm:w-80 border-r border-gray-200 flex flex-col ${selectedChat && 'hidden sm:flex'}`}>
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-100 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                  />
                  <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-grow overflow-y-auto">
                {filteredChats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`p-4 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-50 ${
                      selectedChat === chat.id ? 'bg-brand-teal/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={chat.avatar}
                          alt={chat.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {chat.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-gray-800 truncate">{chat.name}</h3>
                          <span className="text-xs text-gray-500 shrink-0 ml-2">{chat.time}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                          {chat.unread > 0 && (
                            <span className="ml-2 shrink-0 bg-brand-teal text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {chat.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Chat Area */}
            {selectedChat ? (
              <div className={`flex-grow flex flex-col ${!selectedChat && 'hidden sm:flex'}`}>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="sm:hidden text-brand-teal font-bold text-xl"
                  >
                    ←
                  </button>
                  <img
                    src={selectedChatData?.avatar}
                    alt={selectedChatData?.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-grow">
                    <h2 className="font-semibold text-gray-800">{selectedChatData?.name}</h2>
                    <p className="text-xs text-gray-500">
                      {selectedChatData?.online ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.sender === 'me'
                            ? 'bg-brand-teal text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender === 'me' ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-grow bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                    />
                    <button
                      type="submit"
                      className="bg-brand-teal text-white rounded-full px-6 py-2 font-semibold hover:bg-brand-teal-dark transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="hidden sm:flex flex-grow items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Your Messages</h3>
                  <p className="text-gray-500">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessengerPage;