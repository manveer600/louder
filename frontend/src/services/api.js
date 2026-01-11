/**
 * API Service
 * Axios configuration and API endpoints
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Return the data part of the response
    return response.data;
  },
  (error) => {
    // Handle errors globally
    console.error('Axios Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });

    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response (backend might be down)
      return Promise.reject(new Error('Cannot connect to server. Please ensure the backend is running on port 5000.'));
    } else {
      // Something else happened
      return Promise.reject(new Error(error.message || 'An unexpected error occurred'));
    }
  }
);

/**
 * Event API endpoints
 */
export const eventAPI = {
  /**
   * Get all events with filters
   */
  getEvents: async (params = {}) => {
    try {
      const response = await api.get('/events', { params });
      // Response interceptor already returns response.data, so response is the data object
      return response;
    } catch (error) {
      console.error('API Error in getEvents:', error);
      throw error;
    }
  },

  /**
   * Get single event by ID
   */
  getEventById: async (id) => {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get available categories
   */
  getCategories: async () => {
    try {
      const response = await api.get('/events/categories');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get event statistics
   */
  getStats: async () => {
    try {
      const response = await api.get('/events/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * User API endpoints
 */
export const userAPI = {
  /**
   * Check if email already exists for event
   */
  checkEmail: async (email, eventId) => {
    try {
      const response = await api.get('/users/check-email', {
        params: { email, eventId }
      });
      return response;
    } catch (error) {
      console.error('Check email API error:', error);
      throw error;
    }
  },

  /**
   * Save email for event ticket request
   */
  saveEmail: async (data) => {
    try {
      console.log('Sending email save request:', { email: data.email, eventId: data.eventId, consentGiven: data.consentGiven });
      const response = await api.post('/users/email', data);
      console.log('Email save response:', response);
      return response;
    } catch (error) {
      console.error('Email save API error:', error);
      throw error;
    }
  },
};

export default api;

