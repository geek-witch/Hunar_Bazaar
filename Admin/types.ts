
export type UserStatus = 'Active' | 'Restricted' | 'Suspended';
export type SubscriptionType = 'Free' | 'Premium' | 'Professional';

export interface HistoryEvent {
  id: string;
  date: string;
  type: 'Complaint' | 'Restriction' | 'Info';
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  subscription: SubscriptionType;
  status: UserStatus;
  joinedDate: string;
  history: HistoryEvent[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  type: 'Free' | 'Premium' | 'Professional';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  user?: string;
}

export interface SupportTicket {
  id: string;
  user: string;
  userId: string;
  subject: string;
  description: string;
  status: 'Open' | 'Resolved' | 'Pending';
  type: 'Dispute' | 'Query';
  date: string;
  response?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'Dispute' | 'Query' | 'System';
  time: string;
  isRead: boolean;
}
