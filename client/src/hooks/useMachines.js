import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { machinesApi } from '../api/machinesApi';

export const useMachines = (params = {}) => {
  return useQuery({
    queryKey: ['machines', params],
    queryFn: () => machinesApi.getMachines(params),
    refetchInterval: 6000,
  });
};

export const useMachineStats = () => {
  return useQuery({
    queryKey: ['machineStats'],
    queryFn: () => machinesApi.getStats(),
    refetchInterval: 6000,
  });
};

export const useMachineDetail = (id) => {
  return useQuery({
    queryKey: ['machine', id],
    queryFn: () => machinesApi.getMachineById(id),
    enabled: !!id,
    refetchInterval: 5000,
  });
};

export const useMachineMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => machinesApi.createMachine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['machineStats'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => machinesApi.updateMachine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['machine'] });
      queryClient.invalidateQueries({ queryKey: ['machineStats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => machinesApi.deleteMachine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['machineStats'] });
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};
