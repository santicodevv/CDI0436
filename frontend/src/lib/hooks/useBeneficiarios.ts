import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { beneficiariosApi } from '@/lib/api/beneficiarios';
import type { Beneficiario, CierreMudanza, DatosMudanza } from '@/lib/types';
import { clasesKeys } from './useClases';
import { clubsKeys } from './useClubs';
import { supervivenciasKeys } from './useSupervivencias';

// Query key factory
export const beneficiariosKeys = {
  all: ['beneficiarios'] as const,
  lists: () => [...beneficiariosKeys.all, 'list'] as const,
  list: (filters?: Record<string, string>) => [...beneficiariosKeys.lists(), { filters }] as const,
  details: () => [...beneficiariosKeys.all, 'detail'] as const,
  detail: (id: string) => [...beneficiariosKeys.details(), id] as const,
  estadisticas: (id: string) => [...beneficiariosKeys.all, 'estadisticas', id] as const,
  cumpleanos: (mes: number) => [...beneficiariosKeys.all, 'cumpleanos', mes] as const,
  expedientes: (id: string) => [...beneficiariosKeys.all, 'expedientes', id] as const,
  mudanzas: (id: string) => [...beneficiariosKeys.all, 'mudanzas', id] as const,
};

export function useMudanzas(id: string) {
  return useQuery({
    queryKey: beneficiariosKeys.mudanzas(id),
    queryFn: () => beneficiariosApi.getMudanzas(id),
  });
}

export function useRegistrarMudanza(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DatosMudanza) => beneficiariosApi.registrarMudanza(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: beneficiariosKeys.mudanzas(id) }),
  });
}

export function useFinalizarMudanza(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mudanzaId, data }: { mudanzaId: string; data: CierreMudanza }) =>
      beneficiariosApi.finalizarMudanza(id, mudanzaId, data),
    onSuccess: async () => {
      const afectados = [beneficiariosKeys.all, clasesKeys.all, clubsKeys.all, supervivenciasKeys.all];
      await Promise.all(afectados.map(queryKey => queryClient.invalidateQueries({ queryKey })));
    },
  });
}

export function useBeneficiarios(filters?: Record<string, string>) {
  return useQuery({
    queryKey: beneficiariosKeys.list(filters),
    queryFn: () => beneficiariosApi.getAll(filters),
  });
}

export function useBeneficiario(id: string) {
  return useQuery({
    queryKey: beneficiariosKeys.detail(id),
    queryFn: () => beneficiariosApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBeneficiario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Beneficiario>) => beneficiariosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: beneficiariosKeys.lists() });
    },
  });
}

export function useUpdateBeneficiario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Beneficiario> }) =>
      beneficiariosApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: beneficiariosKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: beneficiariosKeys.lists() });
    },
  });
}

export function useDeleteBeneficiario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => beneficiariosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: beneficiariosKeys.lists() });
    },
  });
}

export function useBeneficiarioEstadisticas(id: string) {
  return useQuery({
    queryKey: beneficiariosKeys.estadisticas(id),
    queryFn: () => beneficiariosApi.getEstadisticas(id),
    enabled: !!id,
  });
}

export function useCumpleanosPorMes(mes: number) {
  return useQuery({
    queryKey: beneficiariosKeys.cumpleanos(mes),
    queryFn: () => beneficiariosApi.getCumpleanosPorMes(mes),
    enabled: mes >= 1 && mes <= 12,
  });
}

// ── Expedientes ───────────────────────────────────────────────────────────────

export function useExpedientes(id: string) {
  return useQuery({
    queryKey: beneficiariosKeys.expedientes(id),
    queryFn: () => beneficiariosApi.getExpedientes(id),
    enabled: !!id,
  });
}

export function useAddExpediente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof beneficiariosApi.addExpediente>[1] }) =>
      beneficiariosApi.addExpediente(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: beneficiariosKeys.expedientes(variables.id) });
    },
  });
}

export function useUpdateExpediente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expedienteId, data }: { expedienteId: string; data: Parameters<typeof beneficiariosApi.updateExpediente>[1] }) =>
      beneficiariosApi.updateExpediente(expedienteId, data),
    onSuccess: () => {
      // Invalidate all expediente queries since we don't know which beneficiary
      queryClient.invalidateQueries({ queryKey: [...beneficiariosKeys.all, 'expedientes'] });
    },
  });
}

export function useDeleteExpediente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expedienteId: string) =>
      beneficiariosApi.deleteExpediente(expedienteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...beneficiariosKeys.all, 'expedientes'] });
    },
  });
}

// ── Toggle estado ─────────────────────────────────────────────────────────────

export function useToggleEstadoBeneficiario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => beneficiariosApi.desactivar(id),
    onSuccess: (data) => {
      queryClient.setQueryData(beneficiariosKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: beneficiariosKeys.lists() });
    },
  });
}
