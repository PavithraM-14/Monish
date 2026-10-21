import axiosClient from './axiosClient';

export const authApi = {
  login: async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await axiosClient.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await axiosClient.get('/auth/me');
    return res.data;
  },
  getUsers: async () => {
    const res = await axiosClient.get('/auth/users');
    return res.data;
  },
  getEngineers: async () => {
    const res = await axiosClient.get('/auth/engineers');
    return res.data;
  },
};

