import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bonosRegalosApi, CreateBonoRegaloDto } from '@/lib/api/bonos';

export const bonosKeys = {
  all: ['bonos'] as const,
  regalos: () => [...bonosKeys.all, 'regalos'] as const,
  lista: (filters?: { mes?: string; entregado?: boolean; buscar?: string }) =>
    [...bonosKeys.regalos(), filters] as const,
  estadisticas: (mes?: string) => [...bonosKeys.regalos(), 'estadisticas', mes] as const,
  meses: () => [...bonosKeys.regalos(), 'meses'] as const,
};

export function useBonosRegalos(filters?: { mes?: string; entregado?: boolean; buscar?: string }) {
  return useQuery({
    queryKey: bonosKeys.lista(filters),
    queryFn: () => bonosRegalosApi.getAll(filters),
  });
}

export function useBonosEstadisticas(mes?: string) {
  return useQuery({
    queryKey: bonosKeys.estadisticas(mes),
    queryFn: () => bonosRegalosApi.estadisticas(mes),
  });
}

export function useBonosMeses() {
  return useQuery({
    queryKey: bonosKeys.meses(),
    queryFn: () => bonosRegalosApi.meses(),
  });
}

export function useCrearBonosLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bonos: CreateBonoRegaloDto[]) => bonosRegalosApi.crearLote(bonos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bonosKeys.regalos() });
    },
  });
}

export function useMarcarEntregado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, foto }: { id: string; foto?: File }) =>
      bonosRegalosApi.marcarEntregado(id, foto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bonosKeys.regalos() });
      queryClient.invalidateQueries({ queryKey: bonosKeys.all });
    },
  });
}

export function useEliminarBono() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bonosRegalosApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bonosKeys.regalos() });
    },
  });
}
