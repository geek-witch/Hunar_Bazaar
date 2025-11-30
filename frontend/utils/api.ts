const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/auth';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    availability?: string;
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
};

