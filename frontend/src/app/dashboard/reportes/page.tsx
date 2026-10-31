'use client';

import { useState, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Alert from '@/components/ui/Alert';
import FiltrosReporte from '@/components/reportes/FiltrosReporte';
import ReportesHeader from '@/components/reportes/ReportesHeader';
import ReportesFilters from '@/components/reportes/ReportesFilters';
import ReportePreview from '@/components/reportes/ReportePreview';
import TabSelector from '@/components/reportes/TabSelector';
import {
  useReporteClase,
  useReporteBeneficiario,
  useReporteTutor,
  useReporteGlobal,
  useReporteAusencias,
} from '@/lib/hooks/useReportes';
import {
  generarPDFClase,
  generarPDFBeneficiario,
  generarExcelBeneficiario,
  generarPDFTutor,
  generarExcelTutor,
  generarPDFGlobal,
  generarExcelGlobal,
  generarPDFAusencias,
  generarExcelAusencias,
} from '@/lib/utils/reportesExport';
import { calcularFechasPeriodo, obtenerDescripcionPeriodo, validarFiltrosGlobales } from '@/lib/utils/formatters';
import type {
  TipoPeriodo,
  TipoReporteGlobal,
  TipoReportePrincipal,
  ReportContext,
  ReporteFiltrosClase,
  ReporteFiltrosGlobal,
  ReporteAsistenciaClase,
  ReportePaseListaTutor,
} from '@/lib/types';

export default function ReportesPage() {
  const [tab, setTab] = useState<TipoReportePrincipal>('clase');
  const [periodo, setPeriodo] = useState<TipoPeriodo>('mes');
  const [detalle, setDetalle] = useState<TipoReporteGlobal>('estadistico');
  const [fDia, setFDia] = useState('');
  const [fMes, setFMes] = useState('');
  const [fAnio, setFAnio] = useState(new Date().getFullYear().toString());
  const [fIni, setFIni] = useState('');
  const [fFin, setFFin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fClase, setFClase] = useState<{ claseId?: string; fechaInicio?: string; fechaFin?: string } | null>(null);
  const [fBene, setFBene] = useState<{ beneficiarioId?: string; fechaInicio?: string; fechaFin?: string } | null>(null);
  const [fTutor, setFTutor] = useState<{ tutorId?: string; fechaInicio?: string; fechaFin?: string } | null>(null);
  const [fGlobal, setFGlobal] = useState<ReporteFiltrosGlobal | null>(null);
  const [ctx, setCtx] = useState<ReportContext | null>(null);

  const qClase = useReporteClase(fClase);
  const qBene = useReporteBeneficiario(fBene);
  const qTutor = useReporteTutor(fTutor);
  const qGlobal = useReporteGlobal(fGlobal, detalle);
  const qAusen = useReporteAusencias(fGlobal);

  const data = useMemo(() => {
    const map: Record<TipoReportePrincipal, unknown> = { clase: qClase.data, beneficiario: qBene.data, tutor: qTutor.data, global: qGlobal.data, ausencias: qAusen.data };
    return map[tab] ?? null;
  }, [tab, qClase.data, qBene.data, qTutor.data, qGlobal.data, qAusen.data]);

  const loading = qClase.isLoading || qBene.isLoading || qTutor.isLoading || qGlobal.isLoading || qAusen.isLoading;

  const switchTab = useCallback((t: TipoReportePrincipal) => {
    setTab(t); setFClase(null); setFBene(null); setFTutor(null); setFGlobal(null); setCtx(null); setError(''); setSuccess('');
  }, []);

  const handleSpecific = useCallback((f: ReporteFiltrosClase) => {
    setError(''); setSuccess(''); setFGlobal(null);
    const fr = f.fechaReporte || new Date().toLocaleDateString('es-DO');
    if (tab === 'clase') { setFClase({ claseId: f.id, fechaInicio: f.fechaInicio, fechaFin: f.fechaFin }); setCtx({ tipo: 'clase', filtros: f, fechaReporte: fr }); }
    else if (tab === 'tutor') { setFTutor({ tutorId: f.id, fechaInicio: f.fechaInicio, fechaFin: f.fechaFin }); setCtx({ tipo: 'tutor', filtros: f, fechaReporte: fr }); }
    else { setFBene({ beneficiarioId: f.id, fechaInicio: f.fechaInicio, fechaFin: f.fechaFin }); setCtx({ tipo: 'beneficiario', filtros: f, fechaReporte: fr }); }
  }, [tab]);

  const handleGlobal = useCallback(() => {
    const p = { tipoPeriodo: periodo, fechaDia: fDia, mesSeleccionado: fMes, anioSeleccionado: fAnio, fechaInicio: fIni, fechaFin: fFin };
    const err = validarFiltrosGlobales(p); if (err) { setError(err); return; }
    setError(''); setSuccess(''); setFClase(null); setFBene(null); setFTutor(null);
    const fechas = calcularFechasPeriodo(p);
    const desc = obtenerDescripcionPeriodo(p);
    const fr = new Date().toLocaleDateString('es-DO');
    setFGlobal({ fechaInicio: fechas.fechaInicio, fechaFin: fechas.fechaFin });
    setCtx(tab === 'ausencias' ? { tipo: 'ausencias', periodoDescripcion: desc, fechaReporte: fr } : { tipo: 'global', tipoGlobal: detalle, periodoDescripcion: desc, fechaReporte: fr });
  }, [periodo, fDia, fMes, fAnio, fIni, fFin, tab, detalle]);

  const handleExport = useCallback((fmt: 'pdf' | 'excel') => {
    if (!data || !ctx) return;
    try {
      if (ctx.tipo === 'clase') {
        generarPDFClase(data as ReporteAsistenciaClase).catch(() => setError('Error al exportar. Verifica los datos.'));
      } else if (ctx.tipo === 'beneficiario') {
        if (fmt === 'pdf') {
          generarPDFBeneficiario(data, ctx.fechaReporte).catch(() => setError('Error al exportar. Verifica los datos.'));
        } else {
          generarExcelBeneficiario(data);
        }
      } else if (ctx.tipo === 'tutor') {
        if (fmt === 'pdf') {
          generarPDFTutor(data as ReportePaseListaTutor, ctx.fechaReporte).catch(() => setError('Error al exportar. Verifica los datos.'));
        } else {
          generarExcelTutor(data as ReportePaseListaTutor);
        }
      } else if (ctx.tipo === 'global') {
        if (fmt === 'pdf') {
          generarPDFGlobal(data, ctx.periodoDescripcion, ctx.fechaReporte, ctx.tipoGlobal);
        } else {
          generarExcelGlobal(data, ctx.periodoDescripcion, ctx.tipoGlobal);
        }
      } else if (ctx.tipo === 'ausencias') {
        if (fmt === 'pdf') {
          generarPDFAusencias(data, ctx.periodoDescripcion, ctx.fechaReporte);
        } else {
          generarExcelAusencias(data, ctx.periodoDescripcion);
        }
      }
      setSuccess(`Reporte exportado exitosamente en formato ${fmt.toUpperCase()}`);
    } catch { setError('Error al exportar. Verifica los datos.'); }
  }, [data, ctx]);

  return (
    <ProtectedRoute requiredPermisos={['reportes:ver']}>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <ReportesHeader />
          {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')}>{success}</Alert>}
          <TabSelector activeTab={tab} onSelect={switchTab} />
          {tab === 'global' || tab === 'ausencias' ? (
            <ReportesFilters
              tipoPeriodo={periodo} tipoReporteGlobal={detalle} fechaDia={fDia} mesSeleccionado={fMes}
              anioSeleccionado={fAnio} fechaInicio={fIni} fechaFin={fFin} isLoading={loading} isGlobal
              onChangeTipoPeriodo={setPeriodo} onChangeTipoReporteGlobal={setDetalle}
              onChangeFechaDia={setFDia} onChangeMes={setFMes} onChangeAnio={setFAnio}
              onChangeFechaInicio={setFIni} onChangeFechaFin={setFFin} onGenerate={handleGlobal}
            />
          ) : (
            <FiltrosReporte tipoReporte={tab as 'clase' | 'beneficiario' | 'tutor'} onGenerar={handleSpecific} isLoading={loading} />
          )}
          {data && ctx && (
            <ReportePreview reportData={data} activeReportContext={ctx} onExportPDF={() => handleExport('pdf')} onExportExcel={() => handleExport('excel')} />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
