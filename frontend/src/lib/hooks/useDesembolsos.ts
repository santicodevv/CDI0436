import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desembolsosApi, DesembolsoFiltros, DesembolsoPayload } from '@/lib/api/desembolsos';

export const desembolsosKeys = {
  all: ['desembolsos'] as const,
  lista: (filtros?: DesembolsoFiltros) => [...desembolsosKeys.all, 'lista', filtros] as const,
  beneficiario: (id: string) => [...desembolsosKeys.all, 'beneficiario', id] as const,
  codigo: (codigo: string) => [...desembolsosKeys.all, 'codigo', codigo] as const,
};

export function useDesembolsos(filtros?: DesembolsoFiltros) {
  return useQuery({
    queryKey: desembolsosKeys.lista(filtros),
    queryFn: () => desembolsosApi.getAll(filtros),
  });
}

export function useDesembolsosBeneficiario(beneficiarioId: string, enabled = true) {
  return useQuery({
    queryKey: desembolsosKeys.beneficiario(beneficiarioId),
    queryFn: () => desembolsosApi.getByBeneficiario(beneficiarioId),
    enabled: enabled && !!beneficiarioId,
  });
}

export function useBeneficiarioPorCodigo(codigo: string) {
  return useQuery({
    queryKey: desembolsosKeys.codigo(codigo),
    queryFn: () => desembolsosApi.buscarBeneficiario(codigo),
    enabled: codigo.length > 0,
    retry: false,
  });
}

export function useCrearDesembolso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DesembolsoPayload) => desembolsosApi.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desembolsosKeys.all });
    },
  });
}

export function useActualizarDesembolso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DesembolsoPayload> }) =>
      desembolsosApi.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desembolsosKeys.all });
    },
  });
}

export function useEliminarDesembolso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => desembolsosApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desembolsosKeys.all });
    },
  });
}
