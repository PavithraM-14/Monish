import axiosClient from './axiosClient';

export const chatApi = {
  sendMessage: async (question, machineId = null) => {
    const res = await axiosClient.post('/chat', { question, machineId });
    return res.data;
  },
  getHistory: async () => {
    const res = await axiosClient.get('/chat/history');
    return res.data;
  },
};
