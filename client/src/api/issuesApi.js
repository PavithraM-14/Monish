import axiosClient from './axiosClient';

export const issuesApi = {
  getIssues: async (params) => {
    const res = await axiosClient.get('/issues', { params });
    return res.data;
  },
  getIssueById: async (id) => {
    const res = await axiosClient.get(`/issues/${id}`);
    return res.data;
  },
  createIssue: async (data) => {
    const res = await axiosClient.post('/issues', data);
    return res.data;
  },
  acknowledgeIssue: async (id) => {
    const res = await axiosClient.post(`/issues/${id}/acknowledge`);
    return res.data;
  },
  convertToWorkOrder: async (id, data) => {
    const res = await axiosClient.post(`/issues/${id}/convert`, data);
    return res.data;
  },
  resolveIssue: async (id, data) => {
    const res = await axiosClient.post(`/issues/${id}/resolve`, data);
    return res.data;
  },
};
