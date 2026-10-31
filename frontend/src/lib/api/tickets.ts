import apiClient from './client';

export type TipoTicket = 'mejora' | 'error' | 'otro';
export type PrioridadTicket = 'baja' | 'media' | 'alta';
export type EstadoTicket = 'abierto' | 'en_progreso' | 'completado' | 'rechazado';

export interface Ticket {
  id: string;
  numero: number;
  titulo: string;
  descripcion: string;
  tipo: TipoTicket;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  respuesta: string | null;
  documento_nombre: string | null;
  creado_por: { id: string; nombre: string; correo?: string } | null;
  cerrado_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface CrearTicketPayload {
  titulo: string;
  descripcion: string;
  tipo: TipoTicket;
  prioridad: PrioridadTicket;
  documento?: File | null;
}

export interface ActualizarTicketPayload {
  estado?: EstadoTicket;
  prioridad?: PrioridadTicket;
  respuesta?: string;
}

export const ticketsApi = {
  mios: async (): Promise<Ticket[]> => {
    const response = await apiClient.get('/tickets/mios');
    return response.data;
  },

  getAll: async (filtros?: { estado?: EstadoTicket; buscar?: string }): Promise<Ticket[]> => {
    const params = new URLSearchParams();
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.buscar) params.append('buscar', filtros.buscar);
    const response = await apiClient.get(`/tickets?${params}`);
    return response.data;
  },

  crear: async ({ documento, ...data }: CrearTicketPayload): Promise<Ticket> => {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v));
    if (documento) formData.append('documento', documento);
    const response = await apiClient.post('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  actualizar: async (id: string, data: ActualizarTicketPayload): Promise<Ticket> => {
    const response = await apiClient.patch(`/tickets/${id}`, data);
    return response.data;
  },

  eliminar: async (id: string): Promise<void> => {
    await apiClient.delete(`/tickets/${id}`);
  },

  documento: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/tickets/${id}/documento`, { responseType: 'blob' });
    return response.data;
  },
};
