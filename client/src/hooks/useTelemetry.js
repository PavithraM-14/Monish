import { useQuery } from '@tanstack/react-query';
import { telemetryApi } from '../api/telemetryApi';

export const useTelemetry = (params = {}) => {
  return useQuery({
    queryKey: ['telemetry', params],
    queryFn: () => telemetryApi.getTelemetry(params),
    refetchInterval: 5000, // 5s live polling
    keepPreviousData: true,
  });
};

export const useLatestFleetTelemetry = () => {
  return useQuery({
    queryKey: ['latestFleetTelemetry'],
    queryFn: () => telemetryApi.getLatestFleet(),
    refetchInterval: 5000,
  });
};
