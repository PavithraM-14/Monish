import axiosClient from './axiosClient';

export const reportsApi = {
  getReports: async () => {
    const res = await axiosClient.get('/reports');
    return res.data;
  },
  getReportsData: async () => {
    const res = await axiosClient.get('/reports');
    return res.data;
  },
};
