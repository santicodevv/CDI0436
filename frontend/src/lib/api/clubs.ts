import type { EncuentrosResponse } from '../types';
import apiClient from './client';
import {
  Club,
  AsistenciaClubResponse,
  ClubFoto,
} from '../types';

interface AsistenciaBeneficiario {
  beneficiario_id: string;
  presente: boolean;
  observaciones?: string;
}

interface RegistrarAsistenciaData {
  fecha: string;
  asistencias: AsistenciaBeneficiario[];
}

export const clubsApi = {
  getEncuentros: async (id: string, mes: string): Promise<EncuentrosResponse> => {
    const response = await apiClient.get(`/clubes/${id}/encuentros`, { params: { mes } });
    return response.data;
  },

  configurarEncuentros: async (id: string, mes: string, fechas: string[]): Promise<EncuentrosResponse> => {
    const response = await apiClient.patch(`/clubes/${id}/encuentros`, { mes, fechas });
    return response.data;
  },


  getAll: async (filters?: Record<string, string>): Promise<Club[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
    }
    const response = await apiClient.get(`/clubes?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Club> => {
    const response = await apiClient.get(`/clubes/${id}`);
    return response.data;
  },

  getByCodigo: async (codigo: string): Promise<Club> => {
    const response = await apiClient.get(`/clubes/codigo/${codigo}`);
    return response.data;
  },

  create: async (data: Partial<Club> & { tutor_id?: string }): Promise<Club> => {
    const response = await apiClient.post('/clubes', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Club> & { tutor_id?: string }): Promise<Club> => {
    const response = await apiClient.patch(`/clubes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clubes/${id}`);
  },

  desactivar: async (id: string): Promise<Club> => {
    const response = await apiClient.patch(`/clubes/${id}/desactivar`);
    return response.data;
  },

  getEstadisticas: async (id: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.get(`/clubes/${id}/estadisticas`);
    return response.data;
  },

  agregarBeneficiarios: async (id: string, beneficiarioIds: string[]): Promise<Club> => {
    const response = await apiClient.post(`/clubes/${id}/beneficiarios`, { beneficiarioIds });
    return response.data;
  },

  removerBeneficiario: async (id: string, beneficiarioId: string): Promise<void> => {
    await apiClient.delete(`/clubes/${id}/beneficiarios/${beneficiarioId}`);
  },

  registrarAsistencia: async (id: string, data: RegistrarAsistenciaData): Promise<AsistenciaClubResponse> => {
    const response = await apiClient.post(`/clubes/${id}/asistencias`, data);
    return response.data;
  },

  getAsistenciasPorFecha: async (id: string, fecha: string): Promise<AsistenciaClubResponse> => {
    const response = await apiClient.get(`/clubes/${id}/asistencias?fecha=${fecha}`);
    return response.data;
  },

  getHistorialAsistencias: async (id: string, fechaInicio?: string, fechaFin?: string): Promise<AsistenciaClubResponse[]> => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await apiClient.get(`/clubes/${id}/asistencias/historial?${params}`);
    return response.data;
  },

  getFechasConAsistencia: async (id: string): Promise<string[]> => {
    const response = await apiClient.get(`/clubes/${id}/asistencias/fechas`);
    return response.data;
  },

  subirFoto: async (clubId: string, fecha: string, imagenBase64: string): Promise<ClubFoto> => {
    const response = await apiClient.post(`/clubes/${clubId}/asistencias/foto`, {
      fecha,
      imagen: imagenBase64,
    });
    return response.data;
  },

  getFoto: async (clubId: string, fecha: string): Promise<ClubFoto> => {
    const response = await apiClient.get(`/clubes/${clubId}/asistencias/foto/${fecha}`);
    return response.data;
  },

  eliminarFoto: async (clubId: string, fotoId: string): Promise<void> => {
    await apiClient.delete(`/clubes/${clubId}/asistencias/foto/${fotoId}`);
  },
};
