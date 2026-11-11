import apiClient from './client';
import type {
  BeneficiarioSugerido,
  ExpedienteEntry,
  CumpleanosItem,
  ImportarResultado,
  ReporteCarpetasData,
  EstadisticasGenerales,
  CierreMudanza,
  DatosMudanza,
  MudanzaBeneficiario,
  FiltrosMudanzas,
  ListadoMudanzas,
} from '../types';
import { Beneficiario } from '../types';

export const beneficiariosApi = {
  getAll: async (filters?: Record<string, string>): Promise<Beneficiario[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
    }
    const response = await apiClient.get(`/beneficiarios?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Beneficiario> => {
    const response = await apiClient.get(`/beneficiarios/${id}`);
    return response.data;
  },

  getByCodigo: async (codigo: string): Promise<Beneficiario> => {
    const response = await apiClient.get(`/beneficiarios/codigo/${codigo}`);
    return response.data;
  },

  create: async (data: Partial<Beneficiario>): Promise<Beneficiario> => {
    const response = await apiClient.post('/beneficiarios', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Beneficiario>): Promise<Beneficiario> => {
    const response = await apiClient.patch(`/beneficiarios/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/beneficiarios/${id}`);
  },

  desactivar: async (id: string): Promise<Beneficiario> => {
    const response = await apiClient.patch(`/beneficiarios/${id}/desactivar`);
    return response.data;
  },

  getEstadisticas: async (id: string): Promise<EstadisticasGenerales> => {
    const response = await apiClient.get(`/beneficiarios/${id}/estadisticas`);
    return response.data;
  },

  asignarClases: async (id: string, claseIds: string[]): Promise<Beneficiario> => {
    const response = await apiClient.post(`/beneficiarios/${id}/asignar-clases`, { claseIds });
    return response.data;
  },

  // Nuevos métodos para importación
  importarDesdeExcel: async (
    file: File,
    actualizarExistentes: boolean = false,
    omitirErrores: boolean = true
  ): Promise<ImportarResultado> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('actualizarExistentes', actualizarExistentes.toString());
    formData.append('omitirErrores', omitirErrores.toString());

    const response = await apiClient.post('/beneficiarios/importar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  descargarPlantilla: async (): Promise<Blob> => {
    const response = await apiClient.get('/beneficiarios/plantilla/descargar', {
      responseType: 'blob',
    });
    return response.data;
  },

  exportarAExcel: async (filters?: Record<string, string>): Promise<Blob> => {
    let url = '/beneficiarios/exportar';
    
    if (filters && Object.keys(filters).length > 0) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },

  buscarPublico: async (nombre: string): Promise<BeneficiarioSugerido[]> => {
    const response = await apiClient.get(`/beneficiarios/buscar-publico?nombre=${encodeURIComponent(nombre)}`);
    return response.data;
  },

  getCumpleanosPorMes: async (mes: number): Promise<CumpleanosItem[]> => {
    const response = await apiClient.get(`/beneficiarios/cumpleanos/${mes}`);
    return response.data;
  },

  getReporteCarpetas: async (tipoExpediente?: string, condicion?: string): Promise<ReporteCarpetasData> => {
    const params = new URLSearchParams();
    if (tipoExpediente) params.append('tipoExpediente', tipoExpediente);
    if (condicion) params.append('condicion', condicion);
    
    const url = `/beneficiarios/reporte/carpetas${params.toString() ? '?' + params.toString() : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  getExpedientes: async (id: string): Promise<ExpedienteEntry[]> => {
    const response = await apiClient.get(`/beneficiarios/${id}/expediente`);
    return response.data;
  },

  getMudanzas: async (id: string): Promise<MudanzaBeneficiario[]> => {
    const response = await apiClient.get(`/beneficiarios/${id}/mudanzas`);
    return response.data;
  },

  listarMudanzas: async (filtros: FiltrosMudanzas): Promise<ListadoMudanzas> => {
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== ''),
    );
    const response = await apiClient.get('/mudanzas', { params });
    return response.data;
  },

  registrarMudanza: async (id: string, data: DatosMudanza): Promise<MudanzaBeneficiario> => {
    const response = await apiClient.post(`/beneficiarios/${id}/mudanzas`, data);
    return response.data;
  },

  finalizarMudanza: async (id: string, mudanzaId: string, data: CierreMudanza): Promise<MudanzaBeneficiario> => {
    const response = await apiClient.patch(`/beneficiarios/${id}/mudanzas/${mudanzaId}/finalizar`, data);
    return response.data;
  },

  addExpediente: async (id: string, data: Record<string, unknown>): Promise<ExpedienteEntry> => {
    const response = await apiClient.post(`/beneficiarios/${id}/expediente`, data);
    return response.data;
  },

  deleteExpediente: async (expedienteId: string): Promise<void> => {
    await apiClient.delete(`/beneficiarios/expediente/${expedienteId}`);
  },

  updateExpediente: async (expedienteId: string, data: Record<string, unknown>): Promise<ExpedienteEntry> => {
    const response = await apiClient.patch(`/beneficiarios/expediente/${expedienteId}`, data);
    return response.data;
  },
};
