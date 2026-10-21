import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/ticketsApi';

export const useTickets = (params = {}) => {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => ticketsApi.getTickets(params),
    refetchInterval: 6000,
  });
};

export const useTicketMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => ticketsApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['machineStats'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ticketsApi.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['machine'] });
      queryClient.invalidateQueries({ queryKey: ['machineStats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ticketsApi.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['machineStats'] });
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};
