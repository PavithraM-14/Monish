import axiosClient from './axiosClient';

export const telemetryApi = {
  getTelemetry: async (params) => {
    const res = await axiosClient.get('/telemetry', { params });
    return res.data;
  },
  getLatestFleet: async () => {
    const res = await axiosClient.get('/telemetry/latest');
    return res.data;
  },
  ingestReading: async (data) => {
    const res = await axiosClient.post('/telemetry', data);
    return res.data;
  },
  getExportUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    return `/api/telemetry/export/csv?${query}`;
  },
};
