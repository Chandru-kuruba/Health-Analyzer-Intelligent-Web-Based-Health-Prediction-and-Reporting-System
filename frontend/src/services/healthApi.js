import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const healthApi = {
  // Create health assessment with AI triage
  createAssessment: async (data, token) => {
    const response = await axios.post(
      `${API_URL}/api/health/assess`,
      data,
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000 // 60 second timeout for AI processing
      }
    );
    return response.data;
  },

  // Get all health records
  getRecords: async (token) => {
    const response = await axios.get(
      `${API_URL}/api/health/records`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get single health record
  getRecord: async (recordId, token) => {
    const response = await axios.get(
      `${API_URL}/api/health/records/${recordId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Download PDF
  downloadPdf: async (recordId, token) => {
    const response = await axios.get(
      `${API_URL}/api/health/records/${recordId}/pdf`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      }
    );
    return response.data;
  },

  // Email report
  emailReport: async (recordId, token) => {
    const response = await axios.post(
      `${API_URL}/api/health/records/${recordId}/email`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get health stats
  getStats: async (token) => {
    const response = await axios.get(
      `${API_URL}/api/health/stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Calculate BMI (public endpoint)
  calculateBmi: async (weight, height) => {
    const response = await axios.post(
      `${API_URL}/api/health/calculate-bmi?weight=${weight}&height=${height}`
    );
    return response.data;
  }
};
