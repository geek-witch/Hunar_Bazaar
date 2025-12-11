const AUTH_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/auth';
const API_ROOT_URL = AUTH_BASE_URL.replace(/\/auth$/, '');

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
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

  verifyOTP: async (data: { email: string; code: string }) => {
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
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_ROOT_URL}/skills/${profileId}`, {
        method: 'GET',
        headers,
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to fetch profile',
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
};

