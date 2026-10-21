import axiosClient from './axiosClient';

export const machinesApi = {
  getMachines: async (params) => {
    const res = await axiosClient.get('/machines', { params });
    return res.data;
  },
  getStats: async () => {
    const res = await axiosClient.get('/machines/stats');
    return res.data;
  },
  getMachineById: async (id) => {
    const res = await axiosClient.get(`/machines/${id}`);
    return res.data;
  },
  createMachine: async (data) => {
    const res = await axiosClient.post('/machines', data);
    return res.data;
  },
  updateMachine: async (id, data) => {
    const res = await axiosClient.put(`/machines/${id}`, data);
    return res.data;
  },
  deleteMachine: async (id) => {
    const res = await axiosClient.delete(`/machines/${id}`);
    return res.data;
  },
};
