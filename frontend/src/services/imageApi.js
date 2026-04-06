import axios from "axios";

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const imageApi = {

  // analyze medical image
  analyzeImage: async (base64Image, token) => {
    const res = await axios.post(
      `${API_BASE}/image/analyze`,
      { image_data: base64Image },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000
      }
    );

    return res.data;
  },

  // get all analyses
  getAnalyses: async (token) => {
    const res = await axios.get(
      `${API_BASE}/image/analyses`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return res.data;
  },

  // get single analysis
  getAnalysis: async (analysisId, token) => {
    const res = await axios.get(
      `${API_BASE}/image/analyses/${analysisId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return res.data;
  }
};