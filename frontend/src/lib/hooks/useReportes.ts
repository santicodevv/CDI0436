import { useQuery } from '@tanstack/react-query';
import { asistenciasApi } from '@/lib/api/asistencias';
import type {
  TipoReporteGlobal,
  ReporteFiltrosGlobal,
} from '@/lib/types';

// ── Query key factory ───────────────────────────────────────────────────────

export const reportesKeys = {
  all: ['reportes'] as const,
  reporteClase: (claseId?: string, fechaInicio?: string, fechaFin?: string) =>
    [...reportesKeys.all, 'clase', claseId, { fechaInicio, fechaFin }] as const,
  reporteBeneficiario: (beneficiarioId?: string, fechaInicio?: string, fechaFin?: string) =>
    [...reportesKeys.all, 'beneficiario', beneficiarioId, { fechaInicio, fechaFin }] as const,
  reporteTutor: (tutorId?: string, fechaInicio?: string, fechaFin?: string) =>
    [...reportesKeys.all, 'tutor', tutorId, { fechaInicio, fechaFin }] as const,
  reporteGlobal: (filtros?: ReporteFiltrosGlobal) =>
    [...reportesKeys.all, 'global', filtros] as const,
  reporteAusencias: (filtros?: ReporteFiltrosGlobal) =>
    [...reportesKeys.all, 'ausencias', filtros] as const,
};

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useReporteClase(
  filtros: { claseId?: string; fechaInicio?: string; fechaFin?: string } | null
) {
  return useQuery({
    queryKey: reportesKeys.reporteClase(
      filtros?.claseId,
      filtros?.fechaInicio,
      filtros?.fechaFin
    ),
    queryFn: () =>
      asistenciasApi.getReportePorClase(
        filtros!.claseId!,
        filtros!.fechaInicio,
        filtros!.fechaFin
      ),
    enabled: !!filtros && !!filtros.claseId,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useReporteBeneficiario(
  filtros: { beneficiarioId?: string; fechaInicio?: string; fechaFin?: string } | null
) {
  return useQuery({
    queryKey: reportesKeys.reporteBeneficiario(
      filtros?.beneficiarioId,
      filtros?.fechaInicio,
      filtros?.fechaFin
    ),
    queryFn: () =>
      asistenciasApi.getReportePorBeneficiario(
        filtros!.beneficiarioId!,
        filtros!.fechaInicio,
        filtros!.fechaFin
      ),
    enabled: !!filtros && !!filtros.beneficiarioId,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useReporteTutor(
  filtros: { tutorId?: string; fechaInicio?: string; fechaFin?: string } | null
) {
  return useQuery({
    queryKey: reportesKeys.reporteTutor(
      filtros?.tutorId,
      filtros?.fechaInicio,
      filtros?.fechaFin
    ),
    queryFn: () =>
      asistenciasApi.getPaseListaTutor(
        filtros!.tutorId!,
        filtros!.fechaInicio!,
        filtros!.fechaFin!
      ),
    enabled: !!filtros?.tutorId && !!filtros.fechaInicio && !!filtros.fechaFin,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useReporteGlobal(
  filtros: ReporteFiltrosGlobal | null,
  tipoGlobal: TipoReporteGlobal
) {
  return useQuery({
    queryKey: reportesKeys.reporteGlobal(filtros ?? undefined),
    queryFn: () =>
      asistenciasApi.getReporteGlobal(filtros!.fechaInicio, filtros!.fechaFin, tipoGlobal === 'detallado'),
    enabled: !!filtros,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useReporteAusencias(filtros: ReporteFiltrosGlobal | null) {
  return useQuery({
    queryKey: reportesKeys.reporteAusencias(filtros ?? undefined),
    queryFn: () =>
      asistenciasApi.getReporteAusenciasGeneral(filtros!.fechaInicio, filtros!.fechaFin),
    enabled: !!filtros,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
