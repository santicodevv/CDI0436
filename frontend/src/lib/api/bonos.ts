import apiClient from './client';

export interface BonoRegalo {
  id: string;
  codigo: string;
  beneficiario_nombre: string;
  padre_nombre: string | null;
  cedula: string | null;
  monto: number;
  mes: string;
  expira: string | null;
  entregado: boolean;
  foto_entrega: string | null;
  beneficiario: { id: string; nombre: string; apellido: string } | null;
  registrado_por: { id: string; nombre: string } | null;
  entregado_por: { id: string; nombre: string } | null;
  creado_en: string;
  actualizado_en: string;
}

export interface CreateBonoRegaloDto {
  codigo: string;
  beneficiario_nombre: string;
  padre_nombre?: string;
  cedula?: string;
  monto: number;
  mes: string;
  expira?: string;
  beneficiario_id?: string;
}

export interface BonoRegaloEstadisticas {
  total: number;
  entregados: number;
  pendientes: number;
  monto_total: number;
}

export const bonosRegalosApi = {
  crearLote: async (bonos: CreateBonoRegaloDto[]): Promise<BonoRegalo[]> => {
    const response = await apiClient.post('/bonos/regalos', { bonos });
    return response.data;
  },

  getAll: async (filters?: {
    mes?: string;
    entregado?: boolean;
    buscar?: string;
  }): Promise<BonoRegalo[]> => {
    const params = new URLSearchParams();
    if (filters?.mes) params.append('mes', filters.mes);
    if (filters?.entregado !== undefined) params.append('entregado', String(filters.entregado));
    if (filters?.buscar) params.append('buscar', filters.buscar);
    const response = await apiClient.get(`/bonos/regalos?${params}`);
    return response.data;
  },

  getOne: async (id: string): Promise<BonoRegalo> => {
    const response = await apiClient.get(`/bonos/regalos/${id}`);
    return response.data;
  },

  marcarEntregado: async (id: string, fotoFile?: File): Promise<BonoRegalo> => {
    if (fotoFile) {
      const formData = new FormData();
      formData.append('foto', fotoFile);
      const response = await apiClient.patch(`/bonos/regalos/${id}/entrega`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }
    const response = await apiClient.patch(`/bonos/regalos/${id}/entrega`, {});
    return response.data;
  },

  eliminar: async (id: string): Promise<void> => {
    await apiClient.delete(`/bonos/regalos/${id}`);
  },

  estadisticas: async (mes?: string): Promise<BonoRegaloEstadisticas> => {
    const params = mes ? `?mes=${mes}` : '';
    const response = await apiClient.get(`/bonos/regalos/estadisticas${params}`);
    return response.data;
  },

  meses: async (): Promise<string[]> => {
    const response = await apiClient.get('/bonos/regalos/meses');
    return response.data;
  },
};
