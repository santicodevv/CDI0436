'use client';

import { Eye, FileText, FileSpreadsheet } from 'lucide-react';
import { formatFechaEs } from '@/lib/utils/formatters';
import type { ReportContext, ReporteContextGlobal, ReporteContextAusencias, StatItem, TableRow, ReporteAsistenciaFechaItem as RegistroFecha } from '@/lib/types';
import GraficoAsistencia from './GraficoAsistencia';
import ReporteEstadisticoTable from './ReporteEstadisticoTable';
import ReporteDetalladoTable from './ReporteDetalladoTable';
import ListaAsistenciaClase from './ListaAsistenciaClase';
import ListaFechasReporte from './ListaFechasReporte';
import { actividadesTutor, filasBeneficiario, filasTutor, totalesTutor } from '@/lib/utils/reportesExport';
import type { ReportePaseListaTutor } from '@/lib/types';

interface ReportePreviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex dynamic report shape
  reportData: any;
  activeReportContext: ReportContext;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

function renderDateChips(registros: RegistroFecha[], estado: string, colorClass: string) {
  const filtered = (registros || []).filter(
    (r) => r.estado?.toLowerCase() === estado.toLowerCase()
  );
  if (filtered.length === 0)
    return <span className="text-gray-400 text-xs font-normal">-</span>;

  const isAusente = estado.toLowerCase() === 'ausente';

  return (
    <div className="flex flex-col gap-1.5 min-w-[120px] max-w-[280px]">
      {isAusente && (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-700 border border-red-200 shadow-sm w-fit">
          {filtered.length} {filtered.length === 1 ? 'falta' : 'faltas'}
        </span>
      )}
      <div className="flex flex-wrap gap-1">
        {filtered.map((reg, index) => (
          <span
            key={index}
            title={reg.observaciones ? `Observaciones: ${reg.observaciones}` : undefined}
            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border shadow-xs transition-all hover:scale-105 cursor-default ${colorClass}`}
          >
            {formatFechaEs(reg.fecha)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ReportePreview({
  reportData,
  activeReportContext,
  onExportPDF,
  onExportExcel,
}: ReportePreviewProps) {
  const { tipo } = activeReportContext;
  const tipoGlobal = (activeReportContext as ReporteContextGlobal).tipoGlobal;

  if (!reportData) return null;

  let stats: StatItem[] = [];
  let subtitle = '';
  let tableHeaders: string[] = [];
  let tableRows: TableRow[] = [];

  if (tipo === 'clase') {
    subtitle = reportData.clase?.nombre || '';
  } else if (tipo === 'beneficiario') {
    subtitle = reportData.beneficiario?.nombre || '';
  } else if (tipo === 'tutor') {
    subtitle = reportData.tutor?.nombre || '';
  } else if (tipo === 'global') {
    stats = [
      { label: 'Total Clases', value: reportData.resumen?.totalClases || 0 },
      { label: 'Total Beneficiarios', value: reportData.resumen?.totalBeneficiariosInscritos || 0 },
      { label: 'Asistieron', value: reportData.estadisticasGlobales?.beneficiariosPresentes || 0 },
      { label: '% Asistencia Global', value: reportData.estadisticasGlobales?.porcentajeAsistencia || '0%' },
    ];
    subtitle = (activeReportContext as ReporteContextGlobal | ReporteContextAusencias).periodoDescripcion || 'Historial Completo';

    if (tipoGlobal === 'detallado') {
      tableHeaders = ['Clase', 'Beneficiario', 'Código', 'Presentes', 'Ausentes (Faltas)'];
      tableRows = (reportData.asistenciasPorClase || []).flatMap((item: { clase: { nombre: string; id: string }; asistenciasPorBeneficiario: { beneficiario: { nombre: string; codigo: string; id: string }; registros: RegistroFecha[] }[] }) =>
        (item.asistenciasPorBeneficiario || []).map((ben) => ({
          cells: [
            <span className="font-medium text-gray-900" key="clase">{item.clase.nombre}</span>,
            <span className="font-bold text-gray-900" key="nombre">{ben.beneficiario.nombre}</span>,
            <span className="font-mono text-xs" key="codigo">{ben.beneficiario.codigo}</span>,
            renderDateChips(ben.registros, 'presente', 'bg-green-50 text-green-700 border-green-200'),
            renderDateChips(ben.registros, 'ausente', 'bg-red-50 text-red-700 border-red-200 font-bold'),
          ],
          key: `${item.clase.id}-${ben.beneficiario.id}`,
        }))
      );
    } else {
      tableHeaders = ['Clase', 'Tutor', 'Inscritos', 'Presentes', 'Ausentes', '% Asist.'];
      tableRows = (reportData.asistenciasPorClase || []).map((item: { clase: { nombre: string; tutor?: string; totalBeneficiarios: number; id: string }; estadisticas: { beneficiariosPresentes: number; beneficiariosAusentes: number; porcentajeAsistencia: string } }) => ({
        cells: [
          <span className="font-medium text-gray-900" key="clase">{item.clase.nombre}</span>,
          <span key="tutor">{item.clase.tutor || 'Sin tutor'}</span>,
          <span key="inscritos">{item.clase.totalBeneficiarios}</span>,
          <span className="text-green-600 font-bold" key="presentes">{item.estadisticas.beneficiariosPresentes}</span>,
          <span className="text-red-600 font-bold" key="ausentes">{item.estadisticas.beneficiariosAusentes}</span>,
          <span className="font-semibold" key="porcentaje">{item.estadisticas.porcentajeAsistencia}</span>,
        ],
        key: item.clase.id,
      }));
    }
  } else if (tipo === 'ausencias') {
    stats = [
      { label: 'Total Ausencias', value: reportData.estadisticas?.totalAusencias || 0 },
      { label: 'Alumnos con Faltas', value: reportData.estadisticas?.totalBeneficiariosAusentes || 0 },
      { label: 'Registros Agrupados', value: reportData.estadisticas?.totalRegistros || 0 },
    ];
    subtitle = (activeReportContext as ReporteContextGlobal | ReporteContextAusencias).periodoDescripcion || 'Historial Completo';
    tableHeaders = ['Beneficiario', 'Teléfono', 'Padre / Tutor', 'Dirección', 'Clase', 'Tutor', 'Fechas de Ausencia'];
    tableRows = (reportData.registros || []).map((item: { beneficiario: { nombre: string; codigo?: string; telefono?: string; padre_tutor?: string; direccion?: string; id: string }; clase: { nombre: string; id: string }; tutor: { nombre: string }; fechas: string[] }) => ({
      cells: [
        <div key="beneficiario">
          <p className="font-bold text-gray-900">{item.beneficiario.nombre}</p>
          <p className="text-xs text-gray-500 font-mono">{item.beneficiario.codigo || '-'}</p>
        </div>,
        <span className="text-gray-700" key="telefono">{item.beneficiario.telefono || '-'}</span>,
        <span className="text-gray-700" key="padre">{item.beneficiario.padre_tutor || '-'}</span>,
        <span className="text-gray-600 text-xs" key="direccion">{item.beneficiario.direccion || '-'}</span>,
        <span className="font-medium text-blue-700" key="clase">{item.clase.nombre}</span>,
        <span className="text-gray-600" key="tutor">{item.tutor.nombre}</span>,
        <div className="flex flex-wrap gap-1 max-w-[280px]" key="fechas">
          {(item.fechas || []).map((f: string, i: number) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border shadow-xs bg-red-50 text-red-700 border-red-200 cursor-default"
            >
              {formatFechaEs(f)}
            </span>
          ))}
        </div>,
      ],
      key: `${item.beneficiario.id}-${item.clase.id}`,
    }));
  }

  // Choose the table component based on report type
  const isEstadistico = tipo === 'global' && tipoGlobal === 'estadistico';
  const TableComponent = isEstadistico ? ReporteEstadisticoTable : ReporteDetalladoTable;

  return (
    <div className="bg-white border-2 border-blue-100 rounded-2xl shadow-sm overflow-hidden mt-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Preview header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-600" />
            Vista Previa del Reporte
          </h2>
          <p className="text-sm text-gray-600 mt-1 font-medium">{subtitle}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={onExportPDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all active:scale-95 text-sm"
          >
            <FileText className="w-4 h-4" /> Descargar PDF
          </button>
          {tipo !== 'clase' && (
            <button
              onClick={onExportExcel}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all active:scale-95 text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Descargar Excel
            </button>
          )}
        </div>
      </div>

      {tipo === 'clase' ? (
        <ListaAsistenciaClase data={reportData} />
      ) : tipo === 'beneficiario' ? (
        <BeneficiarioLista data={reportData} periodo={activeReportContext.fechaReporte} />
      ) : tipo === 'tutor' ? (
        <TutorLista data={reportData} periodo={activeReportContext.fechaReporte} />
      ) : (
        <>
          {/* Stats */}
          <GraficoAsistencia stats={stats} />

          {/* Table */}
          <TableComponent headers={tableHeaders} rows={tableRows} />
        </>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex dynamic report shape
function BeneficiarioLista({ data, periodo }: { data: any; periodo: string }) {
  const filas = filasBeneficiario(data);
  const { nombre, codigo, edad } = data.beneficiario || {};
  return (
    <ListaFechasReporte
      titulo="Asistencia del Beneficiario"
      periodo={periodo}
      datos={[['Beneficiario:', nombre || ''], ['Número:', codigo || '-'], ...(edad ? [['Edad:', `${edad} años`] as [string, string]] : [])]}
      columnaActividad="Clase"
      columnaMarca="Presente"
      filas={filas}
      totales={[['Presentes', filas.filter((f) => f.marcada).length], ['Ausentes', filas.filter((f) => !f.marcada).length]]}
      vacio="No hay asistencias registradas en este periodo."
    />
  );
}

function TutorLista({ data, periodo }: { data: ReportePaseListaTutor; periodo: string }) {
  const filas = filasTutor(data);
  return (
    <ListaFechasReporte
      titulo="Control de Pase de Lista"
      periodo={periodo}
      datos={[['Tutor:', data.tutor.nombre], ['Actividades:', String(actividadesTutor(data))]]}
      columnaActividad="Actividad"
      columnaMarca="Pasó lista"
      conTipo
      filas={filas}
      totales={totalesTutor(filas)}
      vacio="No hay clases, clubs ni cursos de Supervivencia con beneficiarios en este periodo."
    />
  );
}
