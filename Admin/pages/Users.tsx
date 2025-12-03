import React, { useState } from 'react';
import { User, SubscriptionPlan, SubscriptionType, UserStatus, HistoryEvent } from '../types';
import { Trash2, Ban, Search, CheckCircle, History, X, Calendar, Check, Filter, ChevronRight, Activity, RotateCcw, MessageSquare, Send } from 'lucide-react';
 
type UIUserStatus = UserStatus | 'Deleted';
 
// Define UIUser to correctly include history
type UIUser = Omit<User, 'status'> & { status: UIUserStatus };
 
const MOCK_USERS: UIUser[] = [
  { 
    id: '1', name: 'Ali Khan', email: 'ali.khan@example.com', 
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', 
    subscription: 'Free', status: 'Active', joinedDate: '2023-10-15',
    history: [] 
  },
  { 
    id: '2', name: 'Sara Ahmed', email: 'sara.ahmed@example.com', 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', 
    subscription: 'Premium', status: 'Active', joinedDate: '2023-11-02',
    history: [{ id: 'h1', date: '2023-11-10', type: 'Complaint', description: 'Filed a dispute against provider ID #44' }] 
  },
  { 
    id: '3', name: 'Bilal Tech', email: 'bilal@techservices.com', 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', 
    subscription: 'Professional', status: 'Restricted', joinedDate: '2023-09-20',
    history: [{ id: 'h2', date: '2023-10-01', type: 'Restriction', description: 'Account restricted due to multiple reports' }]
  },
  { 
    id: '4', name: 'Zainab Bibi', email: 'zainab@example.com', 
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', 
    subscription: 'Free', status: 'Active', joinedDate: '2023-12-10',
    history: []
  },
  { 
    id: '5', name: 'Usman Electric', email: 'usman@fixit.com', 
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', 
    subscription: 'Premium', status: 'Suspended', joinedDate: '2023-08-05',
    history: [{ id: 'h3', date: '2023-09-15', type: 'Complaint', description: 'User reported for rude behavior' }] 
  },
];
 
interface UsersPageProps {
  plans: SubscriptionPlan[];
}
 
export const UsersPage: React.FC<UsersPageProps> = ({ plans }) => {
  const [users, setUsers] = useState<UIUser[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPlanFilters, setSelectedPlanFilters] = useState<SubscriptionType[]>([]);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<UIUserStatus[]>([]);
  const [selectedUser, setSelectedUser] = useState<UIUser | null>(null);
 
  // New state for messaging (admin -> user)
  const [messageModalUser, setMessageModalUser] = useState<UIUser | null>(null);
  const [messageText, setMessageText] = useState('');
 
  // Message templates including warnings
  const MESSAGE_TEMPLATES = [
    {
      id: 'msg_followup',
      label: 'Template: Follow-up Request',
      text: "Hello — to continue the investigation please share any screenshots, timestamps or chat logs. This helps us act faster."
    },
    {
      id: 'warning_1',
      label: 'Template: Warning — Conduct 1',
      text: "Official warning: Your behavior has been reported for violating our community guidelines. Repetition may result in suspension. Please comply immediately."
    },
    {
      id: 'warning_2',
      label: 'Template: Warning — Final Notice',
      text: "Final warning: Multiple reports found for your account. Further violations will result in temporary or permanent suspension. Contact support to appeal."
    },
    {
      id: 'warning_3',
      label: 'Template: Warning — Suspension Notice',
      text: "Your account has been suspended due to repeated violations of our community guidelines. Contact support@hunarbazaar.com to request an appeal."
    },
    {
      id: 'msg_custom',
      label: 'Template: Short Notice',
      text: "Notice: We have received a complaint. Please check your messages and respond if you have an explanation."
    }
  ];
 
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? This will move them to Deleted status.')) {
      const delEvent: HistoryEvent = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        type: 'Info',
        description: 'Account deleted by Administrator'
      };
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Deleted', history: [delEvent, ...u.history] } : u));
      // Close profile if open (deleted accounts don't show details)
      if (selectedUser?.id === id) setSelectedUser(null);
    }
  };
 
  const handleRestore = (id: string) => {
    // restore from Deleted -> Active
    const restoreEvent: HistoryEvent = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: 'Info',
      description: 'Account restored by Administrator'
    };
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Active', history: [restoreEvent, ...u.history] } : u));
    if (selectedUser?.id === id) {
      setSelectedUser(prev => prev ? ({ ...prev, status: 'Active', history: [restoreEvent, ...prev.history] }) : prev);
    }
  };
 
  // Unified status changer — updates users list and currently opened profile (if any)
  const changeUserStatus = (id: string, newStatus: UIUserStatus) => {
    const current = users.find(u => u.id === id);
    if (!current) return;
    if (current.status === 'Deleted' && newStatus !== 'Active') return; // don't change deleted except restore
 
    const eventType = newStatus === 'Restricted' ? 'Restriction' : newStatus === 'Suspended' ? 'Suspension' : 'Info';
    const description =
      newStatus === 'Restricted' ? 'Account restricted by Administrator' :
      newStatus === 'Suspended' ? 'Account suspended by Administrator' :
      'Restriction removed by Administrator';
 
    const newHistoryEvent: HistoryEvent = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: eventType,
      description
    };
 
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus, history: [newHistoryEvent, ...u.history] } : u));
 
    if (selectedUser?.id === id) {
      setSelectedUser(prev => prev ? ({ ...prev, status: newStatus, history: [newHistoryEvent, ...prev.history] }) : prev);
    }
  };
 
  // send admin message/warning to a user (adds to history)
  const sendMessageToUser = (userId: string, message: string, messageType: 'Message' | 'Warning' = 'Message') => {
    const msgEvent: HistoryEvent = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: messageType,
      description: message
    };
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, history: [msgEvent, ...u.history] } : u));
    // if modal showing for same user, update it too
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? ({ ...prev, history: [msgEvent, ...prev.history] }) : prev);
    }
    // close message composer
    setMessageModalUser(null);
    setMessageText('');
  };
 
  const handleStatusChange = (id: string, currentStatus: UIUserStatus) => {
    if (currentStatus === 'Deleted') return;
    // toggle Active <-> Restricted
    if (currentStatus === 'Active') {
      changeUserStatus(id, 'Restricted');
    } else if (currentStatus === 'Restricted') {
      changeUserStatus(id, 'Active');
    } else if (currentStatus === 'Suspended') {
      // if suspended and toggled via previous flow, restore to Active
      changeUserStatus(id, 'Active');
    }
  };
 
  const togglePlanFilter = (type: SubscriptionType) => {
    if (selectedPlanFilters.includes(type)) {
      setSelectedPlanFilters(selectedPlanFilters.filter(t => t !== type));
    } else {
      setSelectedPlanFilters([...selectedPlanFilters, type]);
    }
  };
 
  const toggleStatusFilter = (status: UIUserStatus) => {
    if (selectedStatusFilters.includes(status)) {
      setSelectedStatusFilters(selectedStatusFilters.filter(s => s !== status));
    } else {
      setSelectedStatusFilters([...selectedStatusFilters, status]);
    }
  };
 
  const filteredUsers = users.filter(user => {
    if (selectedStatusFilters.length === 0 && user.status === 'Deleted') return false;

    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                          user.email.toLowerCase().includes(search.toLowerCase());
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(user.joinedDate) >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && new Date(user.joinedDate) <= new Date(endDate);
    }

    let matchesPlan = true;
    if (selectedPlanFilters.length > 0) {
      matchesPlan = selectedPlanFilters.includes(user.subscription);
    }

    let matchesStatus = true;
    if (selectedStatusFilters.length > 0) {
      matchesStatus = selectedStatusFilters.includes(user.status);
    }

    return matchesSearch && matchesDate && matchesPlan && matchesStatus;
  });
 
  const getUserPlanFeatures = (user: UIUser) => {
    const plan = plans.find(p => p.type === user.subscription);
    return plan ? plan.features : [];
  };
 
  const PlanBadge = ({ type }: { type: SubscriptionType }) => (
    <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-blue-50 text-[#0E4B5B] border border-blue-100">
      {type}
    </span>
  );
 
  const StatusBadge = ({ status }: { status: string }) => {
    let styles = '';
    switch (status) {
      case 'Active': styles = 'bg-green-50 text-green-700 border-green-200'; break;
      case 'Restricted': styles = 'bg-orange-50 text-orange-700 border-orange-200'; break;
      case 'Suspended': styles = 'bg-red-50 text-red-700 border-red-200'; break;
      case 'Deleted': styles = 'bg-gray-100 text-gray-500 border-gray-300'; break;
      default: styles = 'bg-gray-50 text-gray-600';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${styles}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${
          status === 'Active' ? 'bg-green-500' : 
          status === 'Restricted' ? 'bg-orange-500' : 
          status === 'Suspended' ? 'bg-red-500' : 'bg-gray-400'
        }`}></div>
        {status}
      </span>
    );
  };
 
  return (
    <div className="space-y-6 relative">
      {/* Filters Bar */}
      <div className="bg-[#E6EEF9] p-4 rounded-xl shadow-sm border border-blue-100 flex flex-col gap-4">
        
        {/* Search & Dates */}
        <div className="flex flex-col xl:flex-row gap-4 w-full">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="w-full pl-10 pr-4 py-3 xl:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E4B5B] focus:border-transparent outline-none bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {/* Date Filter */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm flex-1">
              <span className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">FROM</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm focus:outline-none text-gray-700 w-full uppercase"
              />
            </div>
            <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm flex-1">
              <span className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">TO</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm focus:outline-none text-gray-700 w-full uppercase"
              />
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm flex justify-center items-center"
                title="Clear Date Filter"
              >
                <X size={18} />
                <span className="sm:hidden ml-2 text-sm font-medium">Clear Dates</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 pt-2 border-t border-blue-200">
          {/* Plan Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#0E4B5B] uppercase flex items-center gap-1 mr-2 opacity-70">
              <Filter size={14} /> PLANS:
            </span>
            {['Free', 'Premium', 'Professional'].map((plan) => (
              <button
                key={plan}
                onClick={() => togglePlanFilter(plan as SubscriptionType)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border shadow-sm ${
                  selectedPlanFilters.includes(plan as SubscriptionType)
                    ? 'bg-[#0E4B5B] text-white border-[#0E4B5B]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#0E4B5B] hover:text-[#0E4B5B]'
                }`}
              >
                {plan}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2 md:border-l md:border-blue-200 md:pl-4">
            <span className="text-xs font-bold text-[#0E4B5B] uppercase flex items-center gap-1 mr-2 opacity-70">
              <Activity size={14} /> STATUS:
            </span>
            {['Active', 'Restricted', 'Suspended', 'Deleted'].map((status) => (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status as UIUserStatus)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border shadow-sm ${
                  selectedStatusFilters.includes(status as UIUserStatus)
                    ? 'bg-[#0E4B5B] text-white border-[#0E4B5B]'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          
          {(selectedPlanFilters.length > 0 || selectedStatusFilters.length > 0) && (
            <button 
              onClick={() => { setSelectedPlanFilters([]); setSelectedStatusFilters([]); }}
              className="text-xs text-red-400 hover:text-red-600 ml-auto hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Users Table / Cards */}
      <div className="w-full">
        {/* Desktop Table View */}
        <div className="hidden xl:block bg-[#E6EEF9] rounded-xl shadow-sm border border-blue-100 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-blue-100/50 border-b border-blue-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-[#0E4B5B] uppercase tracking-wider opacity-80">User Profile</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0E4B5B] uppercase tracking-wider opacity-80">Joined Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0E4B5B] uppercase tracking-wider opacity-80">Subscription</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0E4B5B] uppercase tracking-wider opacity-80">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0E4B5B] uppercase tracking-wider opacity-80 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-200/30 transition-colors">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedUser(user)}>
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-500" />
                          {user.joinedDate}
                        </div>
                    </td>
                    <td className="px-6 py-4"><PlanBadge type={user.subscription} /></td>
                    <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="p-2 rounded-lg transition-colors text-gray-500 hover:text-[#0E4B5B] hover:bg-blue-200"
                          title="View Details"
                        >
                          <ChevronRight size={18} />
                        </button>
 
                        {/* Chat / Message icon — open message composer */}
                        {user.status !== 'Deleted' && (
                          <button
                            onClick={() => { setMessageModalUser(user); setMessageText(''); }}
                            className="p-2 rounded-lg transition-colors text-[#0E4B5B] hover:bg-blue-50"
                            title="Send Message / Warning"
                          >
                            <MessageSquare size={18} />
                          </button>
                        )}

                        {user.status !== 'Deleted' ? (
                          <>
                            {/* Active: Restrict, Suspend, Delete */}
                            {user.status === 'Active' && (
                              <>
                                <button 
                                  onClick={() => changeUserStatus(user.id, 'Restricted')}
                                  className="p-2 rounded-lg transition-colors text-orange-500 hover:bg-orange-100"
                                  title="Restrict User"
                                >
                                  <Ban size={18} />
                                </button>
                                <button 
                                  onClick={() => changeUserStatus(user.id, 'Suspended')}
                                  className="p-2 rounded-lg transition-colors text-red-500 hover:bg-red-100"
                                  title="Suspend User"
                                >
                                  <History size={18} />
                                </button>
                              </>
                            )}

                            {/* Restricted: Restore, Suspend, Delete */}
                            {user.status === 'Restricted' && (
                              <>
                                <button 
                                  onClick={() => changeUserStatus(user.id, 'Active')}
                                  className="p-2 rounded-lg transition-colors text-green-600 hover:bg-green-100"
                                  title="Restore to Active"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button 
                                  onClick={() => changeUserStatus(user.id, 'Suspended')}
                                  className="p-2 rounded-lg transition-colors text-red-500 hover:bg-red-100"
                                  title="Suspend User"
                                >
                                  <History size={18} />
                                </button>
                              </>
                            )}

                            {/* Suspended: Restrict, Delete */}
                            {user.status === 'Suspended' && (
                              <>
                                <button 
                                  onClick={() => changeUserStatus(user.id, 'Restricted')}
                                  className="p-2 rounded-lg transition-colors text-orange-500 hover:bg-orange-100"
                                  title="Move to Restricted"
                                >
                                  <Ban size={18} />
                                </button>
                              </>
                            )}

                            {/* Delete button for all non-deleted statuses */}
                            <button 
                              onClick={() => handleDelete(user.id)}
                              className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                            <button 
                              onClick={() => handleRestore(user.id)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Restore User"
                            >
                              <RotateCcw size={18} />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
 
        {/* Mobile/Tablet Card View */}
        <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((user) => (
            <div 
              key={user.id} 
              className="bg-[#E6EEF9] rounded-xl p-5 border shadow-sm border-blue-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUser(user)}>
                  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                  <div>
                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                      onClick={() => setMessageModalUser(user)}
                      className="p-2 text-[#0E4B5B] hover:bg-blue-100 rounded-full"
                      title="Message / Warning"
                  >
                    <MessageSquare size={18} />
                  </button>
                  <button 
                      onClick={() => setSelectedUser(user)}
                      className="p-2 text-gray-400 hover:text-[#0E4B5B] hover:bg-blue-100 rounded-full"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
 
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-1">Joined</span>
                    <span className="flex items-center gap-1 text-gray-800">
                      <Calendar size={12} /> {user.joinedDate}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-1">Plan</span>
                    <div><PlanBadge type={user.subscription} /></div>
                  </div>
                  <div className="col-span-2 flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-1">Status</span>
                    <div><StatusBadge status={user.status} /></div>
                  </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-blue-200">
                  {user.status !== 'Deleted' ? (
                    <>
                      {user.status === 'Active' && (
                        <>
                          <button 
                              onClick={() => changeUserStatus(user.id, 'Restricted')}
                              className="flex-1 py-2 text-xs font-bold uppercase rounded-lg border border-gray-300 hover:bg-white text-gray-600 flex items-center justify-center gap-2"
                          >
                            <Ban size={14}/> Restrict
                          </button>
                          <button 
                              onClick={() => changeUserStatus(user.id, 'Suspended')}
                              className="flex-1 py-2 text-xs font-bold uppercase rounded-lg border border-red-200 hover:bg-red-50 text-red-600 flex items-center justify-center gap-2"
                          >
                            <History size={14}/> Suspend
                          </button>
                        </>
                      )}

                      {user.status === 'Restricted' && (
                        <>
                          <button 
                              onClick={() => changeUserStatus(user.id, 'Active')}
                              className="flex-1 py-2 text-xs font-bold uppercase rounded-lg border border-gray-300 hover:bg-white text-gray-600 flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={14}/> Restore
                          </button>
                          <button 
                              onClick={() => changeUserStatus(user.id, 'Suspended')}
                              className="flex-1 py-2 text-xs font-bold uppercase rounded-lg border border-red-200 hover:bg-red-50 text-red-600 flex items-center justify-center gap-2"
                          >
                            <History size={14}/> Suspend
                          </button>
                        </>
                      )}

                      {user.status === 'Suspended' && (
                        <>
                          <button 
                              onClick={() => changeUserStatus(user.id, 'Restricted')}
                              className="flex-1 py-2 text-xs font-bold uppercase rounded-lg border border-gray-300 hover:bg-white text-gray-600 flex items-center justify-center gap-2"
                          >
                            <Ban size={14}/> Restrict
                          </button>
                        </>
                      )}

                      <button 
                          onClick={() => handleDelete(user.id)}
                          className="flex-1 py-2 text-xs font-bold uppercase rounded-lg border border-red-200 hover:bg-red-50 text-red-600 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14}/> Delete
                      </button>
                    </>
                  ) : (
                    <button 
                        onClick={() => handleRestore(user.id)}
                        className="flex-1 py-2 text-xs font-bold uppercase rounded-lg border border-green-200 hover:bg-green-50 text-green-600 flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={14}/> Restore
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
 
        {/* Message Composer Modal (admin -> user) */}
        {messageModalUser && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMessageModalUser(null)} />
            <div className="relative z-10 w-full max-w-lg bg-[#E6EEF9] rounded-xl shadow-xl border border-blue-200 overflow-hidden">
              <div className="p-4 border-b border-blue-100 flex items-center justify-between bg-[#0E4B5B]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img src={messageModalUser.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{messageModalUser.name}</div>
                    <div className="text-xs text-gray-200">{messageModalUser.email}</div>
                  </div>
                </div>
                <button className="p-2 text-white/80 hover:text-white" onClick={() => setMessageModalUser(null)}><X size={18} /></button>
              </div>
 
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#0E4B5B] uppercase mb-2 block">Quick Templates</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {MESSAGE_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setMessageText(t.text)}
                        className="whitespace-nowrap px-3 py-1 bg-white border border-gray-300 rounded-full text-xs text-gray-700 hover:border-[#0E4B5B] hover:text-[#0E4B5B] hover:bg-blue-50 transition-colors font-medium"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
 
                <div>
                  <label className="text-xs font-bold text-[#0E4B5B] uppercase mb-2 block">Message Content</label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Write a message or pick a template..."
                    className="w-full min-h-[120px] p-3 bg-white border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-[#0E4B5B] focus:border-transparent outline-none"
                  />
                </div>
 
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={() => { setMessageModalUser(null); setMessageText(''); }} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={() => {
                    const type = /warn|warning|final|suspension|suspended/i.test(messageText) ? 'Warning' : 'Message';
                    sendMessageToUser(messageModalUser.id, messageText || 'Admin message', type as any);
                  }} disabled={!messageText} className="px-4 py-2 bg-[#0E4B5B] text-white rounded-lg text-sm font-medium hover:bg-[#093540] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    <Send size={16} /> Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
 
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500 bg-[#E6EEF9] rounded-xl border border-dashed border-blue-200">
            No users found matching your search filters.
          </div>
        )}
      </div>
 
      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
             onClick={() => setSelectedUser(null)}
           />
           
           {/* Modal Content */}
           <div className="bg-[#E6EEF9] rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-300 border-2 border-[#0E4B5B] overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-[#0E4B5B] p-4 flex justify-between items-center shrink-0">
                <h3 className="text-white font-bold text-lg">
                  User Profile
                </h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setMessageModalUser(selectedUser); setMessageText(''); }}
                    className="text-white/90 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                    title="Send Message / Warning"
                  >
                    <MessageSquare size={18} />
                  </button>
                  <button 
                    onClick={() => setSelectedUser(null)} 
                    className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
 
              {/* Body (Scrollable) */}
              <div className="overflow-y-auto p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <img src={selectedUser.avatar} alt="" className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover" />
                    <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white ${selectedUser.status === 'Active' ? 'bg-green-500' : selectedUser.status === 'Restricted' ? 'bg-orange-500' : selectedUser.status === 'Suspended' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                  </div>
                  <h4 className="text-xl font-bold text-[#0E4B5B] mt-3">{selectedUser.name}</h4>
                  <p className="text-sm text-gray-500 mb-3">{selectedUser.email}</p>
                  <div className="flex gap-2">
                    <PlanBadge type={selectedUser.subscription} />
                    <span className="px-3 py-1 bg-white border border-blue-200 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
                       Joined: {selectedUser.joinedDate}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Plan Benefits */}
                  <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                    <h5 className="text-xs font-bold text-[#0E4B5B] uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <CheckCircle size={14} /> Plan Benefits
                    </h5>
                    <ul className="space-y-2">
                      {getUserPlanFeatures(selectedUser).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check size={14} className="mt-0.5 text-green-600 flex-shrink-0" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* History */}
                  <div>
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Activity History</h5>
                    {selectedUser.history.length === 0 ? (
                      <div className="text-center py-4 text-gray-400 italic text-xs bg-white rounded-lg border border-dashed border-gray-200">
                        No history recorded.
                      </div>
                    ) : (
                      <div className="space-y-3 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                        {selectedUser.history.map((event) => (
                          <div key={event.id} className="relative pl-4 border-l-2 border-gray-200 pb-1 last:pb-0">
                            <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${
                              event.type === 'Complaint' ? 'bg-red-400' : 
                              event.type === 'Warning' ? 'bg-orange-400' :
                              event.type === 'Suspension' ? 'bg-red-500' : 'bg-blue-400'
                            }`}></div>
                            <div className="flex justify-between items-start">
                              <p className="text-xs font-bold text-gray-700">{event.type}</p>
                              <p className="text-[10px] text-gray-400">{event.date}</p>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">{event.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
 
              {/* Footer Actions */}
              <div className="p-4 border-t border-blue-200 bg-white flex gap-3 shrink-0 flex-wrap">
                 {selectedUser.status !== 'Deleted' ? (
                    <>
                      {selectedUser.status === 'Active' && (
                        <>
                          <button 
                            onClick={() => { changeUserStatus(selectedUser.id, 'Restricted'); setSelectedUser(null); }}
                            className="flex-1 min-w-[100px] py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <Ban size={14} /> Restrict
                          </button>
                          <button 
                            onClick={() => { changeUserStatus(selectedUser.id, 'Suspended'); setSelectedUser(null); }}
                            className="flex-1 min-w-[100px] py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <History size={14} /> Suspend
                          </button>
                          <button 
                            onClick={() => { handleDelete(selectedUser.id); setSelectedUser(null); }}
                            className="flex-1 min-w-[100px] py-2.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </>
                      )}
 
                      {selectedUser.status === 'Restricted' && (
                        <>
                          <button 
                            onClick={() => { changeUserStatus(selectedUser.id, 'Active'); setSelectedUser(null); }}
                            className="flex-1 min-w-[100px] py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <CheckCircle size={14} /> Restore
                          </button>
                          <button 
                            onClick={() => { changeUserStatus(selectedUser.id, 'Suspended'); setSelectedUser(null); }}
                            className="flex-1 min-w-[100px] py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <History size={14} /> Suspend
                          </button>
                          <button 
                            onClick={() => { handleDelete(selectedUser.id); setSelectedUser(null); }}
                            className="flex-1 min-w-[100px] py-2.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </>
                      )}
 
                      {selectedUser.status === 'Suspended' && (
                        <>
                          <button 
                            onClick={() => { changeUserStatus(selectedUser.id, 'Restricted'); setSelectedUser(null); }}
                            className="flex-1 min-w-[100px] py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <Ban size={14} /> Restrict
                          </button>
                          <button 
                            onClick={() => { handleDelete(selectedUser.id); setSelectedUser(null); }}
                            className="flex-1 min-w-[100px] py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </>
                      )}
                    </>
                 ) : (
                    <button 
                      onClick={() => { handleRestore(selectedUser.id); setSelectedUser(null); }}
                      className="w-full py-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <RotateCcw size={14} /> Restore Account
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};