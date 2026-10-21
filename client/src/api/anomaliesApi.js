import axiosClient from './axiosClient';

export const anomaliesApi = {
  getAnomalies: async (params) => {
    const res = await axiosClient.get('/anomalies', { params });
    return res.data;
  },
  getStats: async () => {
    const res = await axiosClient.get('/anomalies/stats');
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await axiosClient.patch(`/anomalies/${id}/status`, { status });
    return res.data;
  },
};
