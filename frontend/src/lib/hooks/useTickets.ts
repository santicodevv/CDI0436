import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, ActualizarTicketPayload, CrearTicketPayload, EstadoTicket } from '@/lib/api/tickets';

export const ticketsKeys = {
  all: ['tickets'] as const,
  mios: () => [...ticketsKeys.all, 'mios'] as const,
  lista: (filtros?: { estado?: EstadoTicket; buscar?: string }) => [...ticketsKeys.all, 'lista', filtros] as const,
};

export function useMisTickets() {
  return useQuery({
    queryKey: ticketsKeys.mios(),
    queryFn: () => ticketsApi.mios(),
  });
}

export function useTickets(filtros?: { estado?: EstadoTicket; buscar?: string }) {
  return useQuery({
    queryKey: ticketsKeys.lista(filtros),
    queryFn: () => ticketsApi.getAll(filtros),
  });
}

export function useCrearTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CrearTicketPayload) => ticketsApi.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.all });
    },
  });
}

export function useActualizarTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ActualizarTicketPayload }) => ticketsApi.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.all });
    },
  });
}

export function useEliminarTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ticketsApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.all });
    },
  });
}
