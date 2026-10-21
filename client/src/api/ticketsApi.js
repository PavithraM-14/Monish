import axiosClient from './axiosClient';

export const ticketsApi = {
  getTickets: async (params) => {
    const res = await axiosClient.get('/tickets', { params });
    return res.data;
  },
  getStats: async (params) => {
    const res = await axiosClient.get('/tickets/stats', { params });
    return res.data;
  },
  getTicketStats: async (params) => {
    const res = await axiosClient.get('/tickets/stats', { params });
    return res.data;
  },
  getTicketById: async (id) => {
    const res = await axiosClient.get(`/tickets/${id}`);
    return res.data;
  },
  createTicket: async (data) => {
    const res = await axiosClient.post('/tickets', data);
    return res.data;
  },
  updateTicket: async (id, data) => {
    const res = await axiosClient.put(`/tickets/${id}`, data);
    return res.data;
  },
  assignTicket: async (id, data) => {
    const res = await axiosClient.post(`/tickets/${id}/assign`, data);
    return res.data;
  },
  acceptTicket: async (id, note) => {
    const res = await axiosClient.post(`/tickets/${id}/accept`, { note });
    return res.data;
  },
  startTicket: async (id, note) => {
    const res = await axiosClient.post(`/tickets/${id}/start`, { note });
    return res.data;
  },
  updateProgress: async (id, data) => {
    const res = await axiosClient.post(`/tickets/${id}/progress`, data);
    return res.data;
  },
  submitResolution: async (id, data) => {
    const res = await axiosClient.post(`/tickets/${id}/submit-resolution`, data);
    return res.data;
  },
  approveTicket: async (id, data) => {
    const res = await axiosClient.post(`/tickets/${id}/approve`, data);
    return res.data;
  },
  reworkTicket: async (id, data) => {
    const res = await axiosClient.post(`/tickets/${id}/rework`, data);
    return res.data;
  },
  closeTicket: async (id, data) => {
    const res = await axiosClient.post(`/tickets/${id}/close`, data);
    return res.data;
  },
  deleteTicket: async (id) => {
    const res = await axiosClient.delete(`/tickets/${id}`);
    return res.data;
  },
};
