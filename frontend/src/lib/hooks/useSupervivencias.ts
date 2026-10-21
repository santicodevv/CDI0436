import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supervivenciasApi } from '@/lib/api/supervivencias';

// Query key factory
export const supervivenciasKeys = {
  all: ['supervivencias'] as const,
  lists: () => [...supervivenciasKeys.all, 'list'] as const,
  list: (filters?: Record<string, string>) => [...supervivenciasKeys.lists(), { filters }] as const,
  details: () => [...supervivenciasKeys.all, 'detail'] as const,
  detail: (id: string) => [...supervivenciasKeys.details(), id] as const,
  asistencias: (id: string, fecha: string) =>
    [...supervivenciasKeys.all, 'asistencias', id, fecha] as const,
  historialAsistencias: (id: string, fechaInicio?: string, fechaFin?: string) =>
    [...supervivenciasKeys.all, 'historial', id, { fechaInicio, fechaFin }] as const,
  fechasConAsistencia: (id: string) =>
    [...supervivenciasKeys.all, 'fechas', id] as const,
  estadisticas: (id: string) => [...supervivenciasKeys.all, 'estadisticas', id] as const,
  encuentros: (id: string, mes: string) => [...supervivenciasKeys.all, 'encuentros', id, mes] as const,
};

export function useEncuentrosSupervivencia(id: string, mes: string) {
  return useQuery({
    queryKey: supervivenciasKeys.encuentros(id, mes),
    queryFn: () => supervivenciasApi.getEncuentros(id, mes),
    enabled: !!id && !!mes,
  });
}

export function useConfigurarEncuentrosSupervivencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mes, fechas }: { id: string; mes: string; fechas: string[] }) =>
      supervivenciasApi.configurarEncuentros(id, mes, fechas),
    onSuccess: (data, { id, mes }) => {
      queryClient.setQueryData(supervivenciasKeys.encuentros(id, mes), data);
    },
  });
}

export function useSupervivencias(filters?: Record<string, string>) {
  return useQuery({
    queryKey: supervivenciasKeys.list(filters),
    queryFn: () => supervivenciasApi.getAll(filters),
  });
}

export function useSupervivencia(id: string) {
  return useQuery({
    queryKey: supervivenciasKeys.detail(id),
    queryFn: () => supervivenciasApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateSupervivencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof supervivenciasApi.create>[0]) =>
      supervivenciasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervivenciasKeys.lists() });
    },
  });
}

export function useUpdateSupervivencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof supervivenciasApi.update>[1] }) =>
      supervivenciasApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supervivenciasKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: supervivenciasKeys.lists() });
    },
  });
}

export function useDeleteSupervivencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supervivenciasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervivenciasKeys.lists() });
    },
  });
}

export function useRegistrarAsistenciaSupervivencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof supervivenciasApi.registrarAsistencia>[1];
    }) => supervivenciasApi.registrarAsistencia(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supervivenciasKeys.all });
    },
  });
}

export function useAsistenciasSupervivencia(id: string, fecha: string) {
  return useQuery({
    queryKey: supervivenciasKeys.asistencias(id, fecha),
    queryFn: () => supervivenciasApi.getAsistenciasPorFecha(id, fecha),
    enabled: !!id && !!fecha,
  });
}

export function useSupervivenciaEstadisticas(id: string) {
  return useQuery({
    queryKey: supervivenciasKeys.estadisticas(id),
    queryFn: () => supervivenciasApi.getEstadisticas(id),
    enabled: !!id,
  });
}

export function useFechasConAsistencia(id: string) {
  return useQuery({
    queryKey: supervivenciasKeys.fechasConAsistencia(id),
    queryFn: () => supervivenciasApi.getFechasConAsistencia(id),
    enabled: !!id,
  });
}

export function useFotosSupervivencia(supervivenciaId: string, fecha: string) {
  return useQuery({
    queryKey: [...supervivenciasKeys.all, 'fotos', supervivenciaId, fecha] as const,
    queryFn: () => supervivenciasApi.getFoto(supervivenciaId, fecha),
    enabled: !!supervivenciaId && !!fecha,
    // 404 means no photos, not an error
    retry: (failureCount, error: unknown) => {
      const axiosErr = error as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
}

export function useSubirFotoSupervivencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      supervivenciaId,
      fecha,
      imagenBase64,
    }: {
      supervivenciaId: string;
      fecha: string;
      imagenBase64: string;
    }) => supervivenciasApi.subirFoto(supervivenciaId, fecha, imagenBase64),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...supervivenciasKeys.all, 'fotos', variables.supervivenciaId, variables.fecha],
      });
      queryClient.invalidateQueries({ queryKey: [...supervivenciasKeys.all, 'encuentros', variables.supervivenciaId] });
    },
  });
}

export function useEliminarFotoSupervivencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supervivenciaId, fotoId }: { supervivenciaId: string; fotoId: string }) =>
      supervivenciasApi.eliminarFoto(supervivenciaId, fotoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...supervivenciasKeys.all, 'fotos'] });
      queryClient.invalidateQueries({ queryKey: [...supervivenciasKeys.all, 'encuentros'] });
    },
  });
}

export function useAgregarBeneficiariosSupervivencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, beneficiarioIds }: { id: string; beneficiarioIds: string[] }) =>
      supervivenciasApi.agregarBeneficiarios(id, beneficiarioIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supervivenciasKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: supervivenciasKeys.lists() });
    },
  });
}

export function useRemoverBeneficiarioSupervivencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, beneficiarioId }: { id: string; beneficiarioId: string }) =>
      supervivenciasApi.removerBeneficiario(id, beneficiarioId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supervivenciasKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: supervivenciasKeys.lists() });
    },
  });
}
