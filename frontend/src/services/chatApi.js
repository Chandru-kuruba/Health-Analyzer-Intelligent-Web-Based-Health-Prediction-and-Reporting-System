import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const chatApi = {
  // Send chat message
  sendMessage: async (message, sessionId, token) => {
    const response = await axios.post(
      `${API_URL}/api/chat`,
      { 
        message,
        session_id: sessionId || null
      },
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000
      }
    );
    return response.data;
  },

  // Get all chat sessions
  getSessions: async (token) => {
    const response = await axios.get(
      `${API_URL}/api/chat/sessions`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get single session
  getSession: async (sessionId, token) => {
    const response = await axios.get(
      `${API_URL}/api/chat/sessions/${sessionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Delete session
  deleteSession: async (sessionId, token) => {
    const response = await axios.delete(
      `${API_URL}/api/chat/sessions/${sessionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};
