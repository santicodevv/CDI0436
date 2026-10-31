import apiClient from './client';

export interface Ayuda {
  id: string;
  nombre_beneficiario: string;
  codigo_beneficiario: string;
  nombre_madre: string;
  nombre_tutor: string;
  telefono?: string;
  tipo: 'medica' | 'alimentos' | 'pequeno_negocio' | 'educacion' | 'otros';
  tipo_especificacion?: string;
  detalle: string;
  foto_url?: string;
  foto_entrega_url?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  creado_en: string;
}

export interface ComentarioAyuda {
  id: string;
  contenido: string;
  autor: string;
  ayuda_id: string;
  creado_en: string;
}

export interface DisponibilidadAyudas {
  habilitada: boolean;
  motivo: string | null;
  actualizado_por: string | null;
  actualizado_en?: string;
}

export const ayudasApi = {
  getDisponibilidad: async () => {
    const response = await apiClient.get<DisponibilidadAyudas>('/ayudas/disponibilidad');
    return response.data;
  },

  updateDisponibilidad: async (data: { habilitada: boolean; motivo?: string }) => {
    const response = await apiClient.patch<DisponibilidadAyudas>('/ayudas/disponibilidad', data);
    return response.data;
  },

  create: async (data: Omit<Ayuda, 'id' | 'estado' | 'creado_en'>) => {
    const response = await apiClient.post('/ayudas', data);
    return response.data;
  },

  findAll: async () => {
    const response = await apiClient.get<Ayuda[]>('/ayudas');
    return response.data;
  },

  getByCodigoBeneficiario: async (codigo: string) => {
    const response = await apiClient.get<Ayuda[]>(`/ayudas/beneficiario/${encodeURIComponent(codigo)}`);
    return response.data;
  },

  updateEstado: async (id: string, estado: string) => {
    const response = await apiClient.patch(`/ayudas/${id}/estado`, { estado });
    return response.data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/ayudas/${id}`);
  },

  exportar: async () => {
    const response = await apiClient.get('/ayudas/exportar', { responseType: 'blob' });
    return response.data;
  },

  // Comentarios
  getComentarios: async (ayudaId: string) => {
    const response = await apiClient.get<ComentarioAyuda[]>(`/ayudas/${ayudaId}/comentarios`);
    return response.data;
  },

  createComentario: async (ayudaId: string, data: { contenido: string; autor: string }) => {
    const response = await apiClient.post<ComentarioAyuda>(`/ayudas/${ayudaId}/comentarios`, data);
    return response.data;
  },

  updateFotoEntrega: async (id: string, foto_entrega_url: string) => {
    const response = await apiClient.patch<Ayuda>(`/ayudas/${id}/foto-entrega`, { foto_entrega_url });
    return response.data;
  },
};
