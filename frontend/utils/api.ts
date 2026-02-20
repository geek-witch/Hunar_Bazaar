const AUTH_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/auth';
const API_ROOT_URL = AUTH_BASE_URL.replace(/\/auth$/, '');

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: { [key: string]: string };
}

export interface BrowseSkillResult {
  id: string;
  profileId: string;
  name: string;
  email: string;
  teachSkills: string[];
  learnSkills: string[];
  availability?: string;
  profilePic?: string | null;
  isVerified?: boolean;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${AUTH_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle cases where response might not be JSON (e.g., payload too large)
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, it might be a payload size error
      if (response.status === 413 || response.status === 400) {
        return {
          success: false,
          message: 'File size is too large. Please choose an image smaller than 10MB.',
          error: 'Payload too large',
        };
      }
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Request failed',
        error: data.error,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (error: any) {
    // Handle network errors and payload size errors
    if (error.message?.includes('payload') || error.message?.includes('too large')) {
      return {
        success: false,
        message: 'File size is too large. Please choose an image smaller than 10MB.',
        error: error.message,
      };
    }
    return {
      success: false,
      message: error.message || 'Network error occurred',
      error: error.toString(),
    };
  }
}

export const authApi = {
  signup: async (data: {
    firstName: string;
    lastName: string;
    dob: string;
    email: string;
    password: string;
  }) => {
    return apiRequest('/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  signupAndCompleteProfile: async (data: {
    firstName: string;
    lastName: string;
    dob: string;
    email: string;
    password: string;
    bio: string;
    teachSkills: string[];
    learnSkills: string[];
    availability: Array<{ startTime: string; endTime: string; days: string[] }>;
    socialLinks?: string[];
    profilePic?: string | null;
  }) => {
    return apiRequest<{ userId: string; email: string; profile: any }>('/signup-complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  completeProfile: async (data: {
    userId: string;
    firstName: string;
    lastName: string;
    dob: string;
    bio: string;
    teachSkills: string[];
    learnSkills: string[];
    availability: string;
    socialLinks?: string[];
    profilePic?: string | null;
  }) => {
    return apiRequest('/complete-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendSignupOTP: async (data: { email: string }) => {
    return apiRequest('/send-signup-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyOTP: async (data: { email: string; code: string; signupData?: any }) => {
    return apiRequest('/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resendOTP: async (data: { email: string }) => {
    return apiRequest('/resend-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: { email: string; password: string }) => {
    return apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getFirebaseToken: async () => {
    return apiRequest<{ token: string }>('/firebase-token', { method: 'GET' });
  },

  forgotPassword: async (data: { email: string }) => {
    return apiRequest('/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resetPassword: async (data: { token: string; newPassword: string }) => {
    return apiRequest('/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getProfile: async () => {
    return apiRequest('/profile', {
      method: 'GET',
    });
  },

  updateProfile: async (data: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    about?: string;
    availability?: Array<{ startTime: string; endTime: string; days: string[] }> | string;
    teachSkills?: string[];
    learnSkills?: string[];
    socialLinks?: string[];
    profilePic?: string | null;
  }) => {
    return apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    return apiRequest('/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteAccount: async (data: { password: string; reason: string }) => {
    return apiRequest('/account', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },

  getAllSkills: async () => {
    try {
      const url = `${API_ROOT_URL}/skills/list`;
      console.log('Fetching skills from URL:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Skills API response status:', response.status, response.statusText);
      const data = await response.json();
      console.log('Skills API raw data:', data);
      if (!response.ok) {
        console.error('Skills API error response:', data);
        return {
          success: false,
          message: data.message || 'Failed to fetch skills',
          error: data.error,
        };
      }
      const result = {
        success: true,
        ...data,
      };
      console.log('Skills API result:', result);
      return result;
    } catch (error: any) {
      console.error('Skills API fetch error:', error);
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  browseSkills: async (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/skills${query}`, {
        method: 'GET',
        headers,
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to fetch skills',
          error: data.error,
        };
      }
      return {
        success: true,
        ...data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  getPublicProfile: async (profileId: string) => {
    // Try skills/profile by profileId first, fallback to profile by user id.
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      // First try as profileId under skills
      let resp = await fetch(`${API_ROOT_URL}/skills/${profileId}`, { method: 'GET', headers });
      if (resp.ok) {
        const data = await resp.json();
        return { success: true, ...data };
      }

      // Fallback: treat id as userId and fetch profile by user via auth API
      const fallback = await apiRequest(`/by-user/${profileId}`, { method: 'GET' });
      if (fallback.success) {
        return { success: true, ...fallback };
      }
      return { success: false, message: fallback.message || 'Failed to fetch profile', error: fallback.error };
    } catch (error: any) {
      return { success: false, message: error.message || 'Network error occurred', error: error.toString() };
    }
  },
  // Friend APIs
  sendFriendRequest: async (userId: string) => {
    return apiRequest(`/friend-request/${userId}`, {
      method: 'POST'
    });
  },

  respondFriendRequest: async (userId: string, action: 'accept' | 'reject') => {
    return apiRequest(`/friend-respond/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  },

  getFriendRequests: async () => {
    return apiRequest('/friend-requests', { method: 'GET' });
  },

  getFriends: async () => {
    return apiRequest('/friends', { method: 'GET' });
  },
  removeFriend: async (userId: string) => {
    return apiRequest(`/friend/${userId}`, { method: 'DELETE' });
  },
  blockUser: async (userId: string) => {
    return apiRequest(`/block/${userId}`, { method: 'POST' });
  },
  unblockUser: async (userId: string) => {
    return apiRequest(`/unblock/${userId}`, { method: 'POST' });
  },
  checkBlocked: async (userId: string) => {
    return apiRequest<{ isBlocked: boolean }>(`/check-blocked/${userId}`, { method: 'GET' });
  },
  getBlockedByMe: async () => {
    return apiRequest<Array<{ id: string; name: string; profilePic?: string }>>('/blocked-by-me', { method: 'GET' });
  },
};

export const groupApi = {
  createGroup: async (data: { name?: string; image?: string | null; memberIds: string[] }) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resp = await fetch(`${API_ROOT_URL}/groups`, { method: 'POST', headers, body: JSON.stringify(data) });
    return resp.json();
  },
  addMember: async (groupId: string, userId: string) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resp = await fetch(`${API_ROOT_URL}/groups/${groupId}/add`, { method: 'POST', headers, body: JSON.stringify({ memberId: userId }) });
    return resp.json();
  },
  removeMember: async (groupId: string, userId: string) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resp = await fetch(`${API_ROOT_URL}/groups/${groupId}/remove`, { method: 'POST', headers, body: JSON.stringify({ memberId: userId }) });
    return resp.json();
  },
  renameGroup: async (groupId: string, data: { name?: string; image?: string | null }) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resp = await fetch(`${API_ROOT_URL}/groups/${groupId}/rename`, { method: 'POST', headers, body: JSON.stringify(data) });
    return resp.json();
  },
  assignAdmin: async (groupId: string, userId: string, makeAdmin: boolean) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resp = await fetch(`${API_ROOT_URL}/groups/${groupId}/admin`, { method: 'POST', headers, body: JSON.stringify({ memberId: userId, isAdmin: makeAdmin }) });
    return resp.json();
  },
  deleteMessage: async (groupId: string, messageId: string) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resp = await fetch(`${API_ROOT_URL}/groups/${groupId}/delete-message`, { method: 'POST', headers, body: JSON.stringify({ messageId }) });
    return resp.json();
  },
  leaveGroup: async (groupId: string) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resp = await fetch(`${API_ROOT_URL}/groups/${groupId}/leave`, { method: 'POST', headers });
    return resp.json();
  },
  getGroupDetails: async (groupId: string) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resp = await fetch(`${API_ROOT_URL}/groups/${groupId}`, { method: 'GET', headers });
    return resp.json();
  },
  deleteGroup: async (groupId: string) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resp = await fetch(`${API_ROOT_URL}/groups/${groupId}`, { method: 'DELETE', headers });
    return resp.json();
  }
};

export const profileApi = {
  getProfileById: async (id: string) => {
    // Try to fetch by profile id via skills route first (backwards-compatible),
    // otherwise fetch by user id via profile by-user endpoint.
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      // First try as profileId under skills
      let resp = await fetch(`${API_ROOT_URL}/skills/${id}`, { method: 'GET', headers });
      if (resp.ok) return await resp.json();

      // Fallback: treat id as userId and fetch profile by user
      resp = await fetch(`${API_ROOT_URL}/profile/by-user/${id}`, { method: 'GET', headers });
      return await resp.json();
    } catch (err) {
      return { success: false, message: 'Network error', error: String(err) };
    }
  },

  getProgress: async () => {
    return apiRequest('/profile/progress', {
      method: 'GET'
    });
  },

  masterSkill: async (sessionId: string) => {
    return apiRequest('/master-skill', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
  }
};
export const sessionApi = {
  createSession: async (data: {
    learner_id?: string;
    learner_ids?: string[];
    skill_id: string;
    date: string;
    time: string;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to create session',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  getSessions: async (filter?: 'all' | 'teaching' | 'learning', search?: string, status?: 'upcoming' | 'past') => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      const query = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_ROOT_URL}/sessions${query}`, {
        method: 'GET',
        headers,
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to fetch sessions',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  cancelSession: async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/sessions/${sessionId}/cancel`, {
        method: 'PATCH',
        headers,
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to cancel session',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  joinSession: async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/sessions/${sessionId}/join`, {
        method: 'POST',
        headers,
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to join session',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  getMeetingDetails: async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/sessions/${sessionId}/meeting`, {
        method: 'GET',
        headers,
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to get meeting details',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers,
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to delete session',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  completeSession: async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/sessions/${sessionId}/complete`, {
        method: 'PATCH',
        headers,
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to complete session',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },
};

export const feedbackApi = {
  createFeedback: async (data: {
    sessionId: string;
    rating: number;
    comment: string;
    hoursTaught: number;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_ROOT_URL}/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  updateFeedback: async (feedbackId: string, data: {
    rating?: number;
    comment?: string;
    hoursTaught?: number;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_ROOT_URL}/feedback/${feedbackId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  getFeedbacks: async (type: 'received' | 'given' | 'pending') => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_ROOT_URL}/feedback?type=${type}`, {
        method: 'GET',
        headers,
        body: null
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  reportFeedback: async (data: {
    feedbackId: string;
    reason: string;
    description: string;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_ROOT_URL}/feedback/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
};

export const subscriptionApi = {
  getPlans: async () => {
    try {
      const response = await fetch(`${API_ROOT_URL}/subscriptions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to fetch plans',
          error: data.error,
        };
      }
      return {
        success: true,
        ...data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  }
};

export const supportApi = {
  submitIssue: async (data: { category: string; description: string; attachment?: string | null }) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/support/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to submit issue',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  getAllIssues: async (status?: string, category?: string, search?: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      const query = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_ROOT_URL}/support/issues${query}`, {
        method: 'GET',
        headers,
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to fetch issues',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  getIssueComments: async (issueId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/support/issues/${issueId}/comments`, {
        method: 'GET',
        headers,
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to fetch comments',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  addAdminComment: async (issueId: string, message: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/support/issues/${issueId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message }),
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to add comment',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  updateIssueStatus: async (issueId: string, status: 'pending' | 'resolved') => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/support/issues/${issueId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to update status',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },
  reportUser: async (userId: string, reason: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/support/report-user/${userId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to submit report',
          error: result.error,
          daysRemaining: result.daysRemaining,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },

  checkUserReport: async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/support/check-report/${userId}`, {
        method: 'GET',
        headers,
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to check report status',
          error: result.error,
        };
      }
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error occurred',
        error: error.toString(),
      };
    }
  },
};

export const notificationApi = {
  getNotifications: async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_ROOT_URL}/notifications`, { method: 'GET', headers });
      const result = await response.json();
      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to fetch notifications', error: result.error };
      }
      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, message: error.message || 'Network error occurred', error: error.toString() };
    }
  },

  markNotificationAsRead: async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_ROOT_URL}/notifications/${id}/read`, { method: 'PUT', headers });
      const result = await response.json();
      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to mark notification as read', error: result.error };
      }
      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, message: error.message || 'Network error occurred', error: error.toString() };
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_ROOT_URL}/notifications/mark-all-read`, { method: 'PUT', headers });
      const result = await response.json();
      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to mark all notifications as read', error: result.error };
      }
      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, message: error.message || 'Network error occurred', error: error.toString() };
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_ROOT_URL}/notifications/${id}`, { method: 'DELETE', headers });
      const result = await response.json();
      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to delete notification', error: result.error };
      }
      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, message: error.message || 'Network error occurred', error: error.toString() };
    }
  },
};
