import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

adminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const adminApi = {
  // Notifications
  getNotifications: async () => {
    try {
      const response = await adminApiClient.get('/notifications');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching notifications:', error.response?.data || error.message);
      throw error;
    }
  },

  markNotificationAsRead: async (id: string) => {
    try {
      const response = await adminApiClient.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error: any) {
      console.error(`Error marking notification ${id} as read:`, error.response?.data || error.message);
      throw error;
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      const response = await adminApiClient.put('/notifications/mark-all-read');
      return response.data;
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const response = await adminApiClient.delete(`/notifications/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error deleting notification ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    try {
      const response = await adminApiClient.get('/admin/dashboard-stats');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error.response?.data || error.message);
      throw error;
    }
  },

  // Users
  getAllUsers: async () => {
    try {
      const response = await adminApiClient.get('/admin/users');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', error.response?.data || error.message);
      throw error;
    }
  },

  updateUserStatus: async (userId: string, status: string) => {
    try {
      const response = await adminApiClient.patch('/admin/users/status', { userId, status });
      return response.data;
    } catch (error: any) {
      console.error('Error updating user status:', error.response?.data || error.message);
      throw error;
    }
  },

  // Subscriptions
  getSubscriptions: async () => {
    try {
      const response = await adminApiClient.get('/subscriptions');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error.response?.data || error.message);
      throw error;
    }
  },

  updateSubscriptionPlan: async (id: string, data: any) => {
    try {
      const response = await adminApiClient.put(`/subscriptions/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating subscription plan ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },
};
