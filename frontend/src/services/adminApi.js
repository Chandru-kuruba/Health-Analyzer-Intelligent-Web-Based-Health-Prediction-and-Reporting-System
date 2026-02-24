import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const adminApi = {
  // Get dashboard stats
  getStats: async (token) => {
    const response = await axios.get(
      `${API_URL}/api/admin/stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get all users with pagination, search, and role filter
  getUsers: async (token, skip = 0, limit = 50, search = '', role = '') => {
    let url = `${API_URL}/api/admin/users?skip=${skip}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (role) url += `&role=${role}`;
    const response = await axios.get(url, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return response.data;
  },

  // Get user details
  getUserDetails: async (userId, token) => {
    const response = await axios.get(
      `${API_URL}/api/admin/users/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Create new user
  createUser: async (userData, token) => {
    const response = await axios.post(
      `${API_URL}/api/admin/users`,
      userData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId, role, token) => {
    const response = await axios.put(
      `${API_URL}/api/admin/users/${userId}/role`,
      { role },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Reset user password
  resetUserPassword: async (userId, newPassword, token) => {
    const response = await axios.put(
      `${API_URL}/api/admin/users/${userId}/password`,
      { newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Delete user
  deleteUser: async (userId, token) => {
    const response = await axios.delete(
      `${API_URL}/api/admin/users/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get all health records
  getHealthRecords: async (token, skip = 0, limit = 50, riskLevel = '') => {
    let url = `${API_URL}/api/admin/health-records?skip=${skip}&limit=${limit}`;
    if (riskLevel) url += `&risk_level=${riskLevel}`;
    const response = await axios.get(url, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return response.data;
  },

  // Get all image analyses
  getImageAnalyses: async (token, skip = 0, limit = 50, severity = '', emergencyOnly = false) => {
    let url = `${API_URL}/api/admin/image-analyses?skip=${skip}&limit=${limit}`;
    if (severity) url += `&severity=${severity}`;
    if (emergencyOnly) url += `&emergency_only=true`;
    const response = await axios.get(url, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return response.data;
  },

  // Get all chat sessions
  getChatSessions: async (token, skip = 0, limit = 50, emergencyOnly = false) => {
    let url = `${API_URL}/api/admin/chat-sessions?skip=${skip}&limit=${limit}`;
    if (emergencyOnly) url += `&emergency_only=true`;
    const response = await axios.get(url, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    return response.data;
  },

  // Get chat session details
  getChatSessionDetails: async (sessionId, token) => {
    const response = await axios.get(
      `${API_URL}/api/admin/chat-sessions/${sessionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get admin logs
  getAdminLogs: async (token, skip = 0, limit = 100) => {
    const response = await axios.get(
      `${API_URL}/api/admin/logs?skip=${skip}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};
