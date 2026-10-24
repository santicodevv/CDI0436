import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubsApi } from '@/lib/api/clubs';

export const clubsKeys = {
  all: ['clubes'] as const,
  encuentros:(id:string,mes:string)=>[...clubsKeys.all,'encuentros',id,mes] as const,
  lists: () => [...clubsKeys.all, 'list'] as const,
  list: (filters?: Record<string, string>) => [...clubsKeys.lists(), { filters }] as const,
  details: () => [...clubsKeys.all, 'detail'] as const,
  detail: (id: string) => [...clubsKeys.details(), id] as const,
  asistencias: (id: string, fecha: string) =>
    [...clubsKeys.all, 'asistencias', id, fecha] as const,
  historialAsistencias: (id: string, fechaInicio?: string, fechaFin?: string) =>
    [...clubsKeys.all, 'historial', id, { fechaInicio, fechaFin }] as const,
  fechasConAsistencia: (id: string) =>
    [...clubsKeys.all, 'fechas', id] as const,
  estadisticas: (id: string) => [...clubsKeys.all, 'estadisticas', id] as const,
};

export function useClubs(filters?: Record<string, string>) {
  return useQuery({
    queryKey: clubsKeys.list(filters),
    queryFn: () => clubsApi.getAll(filters),
  });
}

export function useClub(id: string) {
  return useQuery({
    queryKey: clubsKeys.detail(id),
    queryFn: () => clubsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof clubsApi.create>[0]) =>
      clubsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubsKeys.lists() });
    },
  });
}

export function useUpdateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof clubsApi.update>[1] }) =>
      clubsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clubsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: clubsKeys.lists() });
    },
  });
}

export function useDeleteClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clubsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubsKeys.lists() });
    },
  });
}

export function useRegistrarAsistenciaClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof clubsApi.registrarAsistencia>[1];
    }) => clubsApi.registrarAsistencia(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubsKeys.all });
    },
  });
}

export function useAsistenciasClub(id: string, fecha: string) {
  return useQuery({
    queryKey: clubsKeys.asistencias(id, fecha),
    queryFn: () => clubsApi.getAsistenciasPorFecha(id, fecha),
    enabled: !!id && !!fecha,
  });
}

export function useClubEstadisticas(id: string) {
  return useQuery({
    queryKey: clubsKeys.estadisticas(id),
    queryFn: () => clubsApi.getEstadisticas(id),
    enabled: !!id,
  });
}

export function useFechasConAsistenciaClub(id: string) {
  return useQuery({
    queryKey: clubsKeys.fechasConAsistencia(id),
    queryFn: () => clubsApi.getFechasConAsistencia(id),
    enabled: !!id,
  });
}

export function useFotosClub(clubId: string, fecha: string) {
  return useQuery({
    queryKey: [...clubsKeys.all, 'fotos', clubId, fecha] as const,
    queryFn: () => clubsApi.getFoto(clubId, fecha),
    enabled: !!clubId && !!fecha,
    retry: (failureCount, error: unknown) => {
      const axiosErr = error as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
}

export function useSubirFotoClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clubId,
      fecha,
      imagenBase64,
    }: {
      clubId: string;
      fecha: string;
      imagenBase64: string;
    }) => clubsApi.subirFoto(clubId, fecha, imagenBase64),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...clubsKeys.all, 'fotos', variables.clubId, variables.fecha],
      });
      queryClient.invalidateQueries({queryKey:[...clubsKeys.all,'encuentros']});
    },
  });
}

export function useEliminarFotoClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clubId, fotoId }: { clubId: string; fotoId: string }) =>
      clubsApi.eliminarFoto(clubId, fotoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...clubsKeys.all, 'fotos'] });
      queryClient.invalidateQueries({ queryKey: [...clubsKeys.all, 'encuentros'] });
    },
  });
}

export function useAgregarBeneficiariosClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, beneficiarioIds }: { id: string; beneficiarioIds: string[] }) =>
      clubsApi.agregarBeneficiarios(id, beneficiarioIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clubsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: clubsKeys.lists() });
    },
  });
}

export function useRemoverBeneficiarioClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, beneficiarioId }: { id: string; beneficiarioId: string }) =>
      clubsApi.removerBeneficiario(id, beneficiarioId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clubsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: clubsKeys.lists() });
    },
  });
}

export function useEncuentrosClub(id: string, mes: string) {
  return useQuery({
    queryKey: clubsKeys.encuentros(id, mes),
    queryFn: () => clubsApi.getEncuentros(id, mes),
    enabled: !!id && !!mes,
  });
}

export function useConfigurarEncuentrosClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mes, fechas }: { id: string; mes: string; fechas: string[] }) =>
      clubsApi.configurarEncuentros(id, mes, fechas),
    onSuccess: (data, { id, mes }) => {
      queryClient.setQueryData(clubsKeys.encuentros(id, mes), data);
    },
  });
}
