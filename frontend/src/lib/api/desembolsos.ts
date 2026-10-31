import apiClient from './client';

export interface Desembolso {
  id: string;
  fecha: string;
  detalle: string;
  codigo_beneficiario: string;
  nombre_beneficiario: string;
  referencia: string | null;
  cuenta: string | null;
  monto: number;
  registrado_por?: { id: string; nombre: string } | null;
  creado_en: string;
  actualizado_en: string;
}

export interface DesembolsoPayload {
  fecha: string;
  detalle: string;
  codigo_beneficiario: string;
  referencia?: string;
  cuenta?: string;
  monto: number;
}

export interface DesembolsoFiltros {
  buscar?: string;
  desde?: string;
  hasta?: string;
}

export interface BeneficiarioResumen {
  id: string;
  codigo: string;
  nombre: string;
}

export const desembolsosApi = {
  getAll: async (filtros?: DesembolsoFiltros): Promise<Desembolso[]> => {
    const params = new URLSearchParams();
    if (filtros?.buscar) params.append('buscar', filtros.buscar);
    if (filtros?.desde) params.append('desde', filtros.desde);
    if (filtros?.hasta) params.append('hasta', filtros.hasta);
    const response = await apiClient.get(`/desembolsos?${params}`);
    return response.data;
  },

  getByBeneficiario: async (beneficiarioId: string): Promise<Desembolso[]> => {
    const response = await apiClient.get(`/desembolsos/beneficiario/${beneficiarioId}`);
    return response.data;
  },

  buscarBeneficiario: async (codigo: string): Promise<BeneficiarioResumen> => {
    const response = await apiClient.get(
      `/desembolsos/beneficiario/codigo/${encodeURIComponent(codigo)}`,
    );
    return response.data;
  },

  crear: async (data: DesembolsoPayload): Promise<Desembolso> => {
    const response = await apiClient.post('/desembolsos', data);
    return response.data;
  },

  actualizar: async (id: string, data: Partial<DesembolsoPayload>): Promise<Desembolso> => {
    const response = await apiClient.patch(`/desembolsos/${id}`, data);
    return response.data;
  },

  eliminar: async (id: string): Promise<void> => {
    await apiClient.delete(`/desembolsos/${id}`);
  },
};
