import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ayudasApi } from '@/lib/api/ayudas';

// Query key factory
export const ayudasKeys = {
  all: ['ayudas'] as const,
  lists: () => [...ayudasKeys.all, 'list'] as const,
  detalles: () => [...ayudasKeys.all, 'detail'] as const,
  comentarios: (ayudaId: string) => [...ayudasKeys.all, 'comentarios', ayudaId] as const,
  disponibilidad: () => [...ayudasKeys.all, 'disponibilidad'] as const,
};

export function useDisponibilidadAyudas() {
  return useQuery({
    queryKey: ayudasKeys.disponibilidad(),
    queryFn: () => ayudasApi.getDisponibilidad(),
  });
}

export function useUpdateDisponibilidadAyudas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof ayudasApi.updateDisponibilidad>[0]) =>
      ayudasApi.updateDisponibilidad(data),
    onSuccess: (disponibilidad) => {
      queryClient.setQueryData(ayudasKeys.disponibilidad(), disponibilidad);
    },
  });
}

export function useAyudas() {
  return useQuery({
    queryKey: ayudasKeys.lists(),
    queryFn: () => ayudasApi.findAll(),
  });
}

export function useCreateAyuda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof ayudasApi.create>[0]) =>
      ayudasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ayudasKeys.lists() });
    },
  });
}

export function useUpdateEstadoAyuda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      ayudasApi.updateEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ayudasKeys.lists() });
    },
  });
}

export function useDeleteAyuda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ayudasApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ayudasKeys.lists() });
    },
  });
}

export function useComentariosAyuda(ayudaId: string) {
  return useQuery({
    queryKey: ayudasKeys.comentarios(ayudaId),
    queryFn: () => ayudasApi.getComentarios(ayudaId),
    enabled: !!ayudaId,
  });
}

export function useCreateComentarioAyuda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ayudaId,
      data,
    }: {
      ayudaId: string;
      data: { contenido: string; autor: string };
    }) => ayudasApi.createComentario(ayudaId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ayudasKeys.comentarios(variables.ayudaId) });
    },
  });
}

export function useUpdateFotoEntregaAyuda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, fotoUrl }: { id: string; fotoUrl: string }) =>
      ayudasApi.updateFotoEntrega(id, fotoUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ayudasKeys.lists() });
    },
  });
}

export function useExportAyudas() {
  return useMutation({
    mutationFn: () => ayudasApi.exportar(),
  });
}
