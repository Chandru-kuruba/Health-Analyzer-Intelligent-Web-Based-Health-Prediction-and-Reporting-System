import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const imageApi = {
  // Analyze medical image
  analyzeImage: async (imageData, token) => {
    const response = await axios.post(
      `${API_URL}/api/image/analyze`,
      { image_data: imageData },
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000 // 2 min timeout for image analysis
      }
    );
    return response.data;
  },

  // Get all image analyses for user
  getAnalyses: async (token) => {
    const response = await axios.get(
      `${API_URL}/api/image/analyses`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get single analysis
  getAnalysis: async (analysisId, token) => {
    const response = await axios.get(
      `${API_URL}/api/image/analyses/${analysisId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};
