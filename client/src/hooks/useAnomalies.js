import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anomaliesApi } from '../api/anomaliesApi';

export const useAnomalies = (params = {}) => {
  return useQuery({
    queryKey: ['anomalies', params],
    queryFn: () => anomaliesApi.getAnomalies(params),
    refetchInterval: 5000,
  });
};

export const useAnomalyStats = () => {
  return useQuery({
    queryKey: ['anomalyStats'],
    queryFn: () => anomaliesApi.getStats(),
    refetchInterval: 5000,
  });
};

export const useUpdateAnomalyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => anomaliesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['anomalyStats'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['machineStats'] });
    },
  });
};
