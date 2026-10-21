import axiosClient from './axiosClient';

export const activitiesApi = {
  getActivities: async (params) => {
    const res = await axiosClient.get('/activities', { params });
    return res.data;
  },
};
