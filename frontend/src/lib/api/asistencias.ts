import apiClient from './client';
import type { ReportePaseListaTutor } from '../types';
import {
  Asistencia,
  EstadoAsistencia,
  ReporteAsistenciaClase,
  ReporteAsistenciaBeneficiario,
  ResumenClase,
  FotoAsistencia,
  EstadisticasGenerales,
} from '../types';

export const asistenciasApi = {
  getPaseListaTutor: async (tutorId: string, fechaInicio: string, fechaFin: string): Promise<ReportePaseListaTutor> => {
    const response = await apiClient.get(`/asistencias/reporte/tutor/${tutorId}/pendientes`, { params: { fechaInicio, fechaFin } });
    return response.data;
  },
  getAll: async (filters?: Record<string, string>): Promise<Asistencia[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
    }
    const response = await apiClient.get(`/asistencias?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Asistencia> => {
    const response = await apiClient.get(`/asistencias/${id}`);
    return response.data;
  },

  create: async (data: Partial<Asistencia>): Promise<Asistencia> => {
    const response = await apiClient.post('/asistencias', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Asistencia>): Promise<Asistencia> => {
    const response = await apiClient.patch(`/asistencias/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/asistencias/${id}`);
  },

  // Registro masivo
  registrarAsistenciaMasiva: async (data: {
    claseId: string;
    fecha: string;
    asistencias: Array<{
      beneficiarioId: string;
      estado: EstadoAsistencia;
      observaciones?: string;
    }>;
  }): Promise<Asistencia[]> => {
    const response = await apiClient.post('/asistencias/masiva', data);
    return response.data;
  },

  // Marcar todos con el mismo estado
  marcarTodos: async (data: {
    claseId: string;
    fecha: string;
    estado: EstadoAsistencia;
    observaciones?: string;
  }): Promise<Asistencia[]> => {
    const response = await apiClient.post('/asistencias/marcar-todos', data);
    return response.data;
  },

  // Justificar ausencias
  justificarMasivo: async (data: {
    claseId: string;
    fecha: string;
    beneficiarioIds: string[];
    observaciones?: string;
  }): Promise<Asistencia[]> => {
    const response = await apiClient.post('/asistencias/justificar-masivo', data);
    return response.data;
  },

  // Obtener asistencias por clase y fecha
  getByClaseYFecha: async (claseId: string, fecha: string): Promise<Asistencia[]> => {
    const response = await apiClient.get(`/asistencias/clase/${claseId}/fecha/${fecha}`);
    return response.data;
  },

  // Reportes
  getReportePorClase: async (
    claseId: string, 
    fechaInicio?: string, 
    fechaFin?: string
  ): Promise<ReporteAsistenciaClase> => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await apiClient.get(`/asistencias/reporte/clase/${claseId}?${params}`);
    return response.data;
  },

  getReportePorBeneficiario: async (
    beneficiarioId: string,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<ReporteAsistenciaBeneficiario> => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const response = await apiClient.get(`/asistencias/reporte/beneficiario/${beneficiarioId}?${params}`);
    return response.data;
  },

  getEstadisticasMensuales: async (mes: number, anio: number): Promise<EstadisticasGenerales> => {
    const response = await apiClient.get(`/asistencias/estadisticas/mensuales/${mes}/${anio}`);
    return response.data;
  },
  getResumenPorFecha: async (fecha: string): Promise<ResumenClase[]> => {
    const response = await apiClient.get(`/asistencias/resumen/fecha/${fecha}`);
    return response.data;
  },

  // Reporte global de todas las clases
  getReporteGlobal: async (fechaInicio?: string, fechaFin?: string, detallado?: boolean) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    if (detallado !== undefined) params.append('detallado', detallado.toString());

    const response = await apiClient.get(`/asistencias/reporte/global?${params}`);
    return response.data;
  },

  getReporteAusenciasGeneral: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);

    const response = await apiClient.get(`/asistencias/reporte/ausencias?${params}`);
    return response.data;
  },

  // ===================== FOTOS DE ASISTENCIA =====================

  // Subir foto de asistencia (Base64)
  subirFoto: async (claseId: string, fecha: string, imagenBase64: string): Promise<FotoAsistencia> => {
    const response = await apiClient.post('/asistencias/foto', {
      claseId,
      fecha,
      imagen: imagenBase64,
    });
    return response.data;
  },

  // Obtener foto por clase y fecha
  getFoto: async (claseId: string, fecha: string): Promise<FotoAsistencia> => {
    const response = await apiClient.get(`/asistencias/foto/${claseId}/${fecha}`);
    return response.data;
  },

  // Eliminar foto
  eliminarFoto: async (id: string): Promise<void> => {
    await apiClient.delete(`/asistencias/foto/${id}`);
  },
};
