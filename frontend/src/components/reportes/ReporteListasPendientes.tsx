'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, endOfMonth, format, parseISO, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { isAxiosError } from 'axios';
import { Calendar, FileSpreadsheet, FileText } from 'lucide-react';
import { useTutores } from '@/lib/hooks/useTutores';
import { asistenciasApi } from '@/lib/api/asistencias';
import type { EstadoPaseLista } from '@/lib/types';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import ReporteEstadisticoTable from './ReporteEstadisticoTable';
import GraficoAsistencia from './GraficoAsistencia';
import { exportToPDF } from '@/lib/utils/exportPDF';
import { exportToExcel } from '@/lib/utils/exportExcel';

const ESTADOS: Record<EstadoPaseLista, string> = {
  sin_registro: 'No pasó lista',
  parcial: 'Lista incompleta',
  registrada: 'Lista registrada',
  pendiente_hoy: 'Pendiente hoy',
  programada: 'Programada (futura)',
};
const TIPOS = { clase: 'Clase', club: 'Club', supervivencia: 'Supervivencia' };

export default function ReporteListasPendientes() {
  const [tutorId, setTutorId] = useState('');
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes' | 'rango'>(
    'mes'
  );
  const [dia, setDia] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [mes, setMes] = useState(() => format(new Date(), 'yyyy-MM'));
  const [inicio, setInicio] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [fin, setFin] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [filtroEstado, setFiltroEstado] = useState('sin_registro');
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState<{
    tutorId: string;
    fechaInicio: string;
    fechaFin: string;
  } | null>(null);
  const tutores = useTutores();
  const reporte = useQuery({
    queryKey: ['reportes', 'pase-lista-tutor', filtros],
    queryFn: () =>
      asistenciasApi.getPaseListaTutor(
        filtros!.tutorId,
        filtros!.fechaInicio,
        filtros!.fechaFin
      ),
    enabled: !!filtros,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const generar = () => {
    if (!tutorId) {
      setError('Selecciona un tutor.');
      return;
    }
    let fechaInicio = inicio,
      fechaFin = fin;
    if (periodo === 'mes') {
      if (!/^\d{4}-\d{2}$/.test(mes)) {
        setError('Selecciona un mes válido.');
        return;
      }
      fechaInicio = `${mes}-01`;
      fechaFin = format(endOfMonth(parseISO(fechaInicio)), 'yyyy-MM-dd');
    } else if (periodo === 'dia' || periodo === 'semana') {
      if (!dia) {
        setError('Selecciona una fecha.');
        return;
      }
      const fecha =
        periodo === 'semana'
          ? startOfWeek(parseISO(dia), { weekStartsOn: 1 })
          : parseISO(dia);
      fechaInicio = format(fecha, 'yyyy-MM-dd');
      fechaFin = format(
        periodo === 'semana' ? addDays(fecha, 6) : fecha,
        'yyyy-MM-dd'
      );
    }
    if (!fechaInicio || !fechaFin || fechaInicio > fechaFin) {
      setError('Revisa las fechas del período.');
      return;
    }
    setError('');
    if (
      filtros?.tutorId === tutorId &&
      filtros.fechaInicio === fechaInicio &&
      filtros.fechaFin === fechaFin
    ) {
      void reporte.refetch();
    } else setFiltros({ tutorId, fechaInicio, fechaFin });
  };
  const data = reporte.data;
  const sesiones =
    data?.sesiones.filter(
      (s) => filtroEstado === 'todos' || s.estado === filtroEstado
    ) ?? [];
  const filasExport = sesiones.map((s) => ({
    Fecha: format(parseISO(s.fecha), 'dd/MM/yyyy'),
    Día: format(parseISO(s.fecha), 'EEEE', { locale: es }),
    Tipo: TIPOS[s.tipo],
    Actividad: s.actividad,
    Código: s.codigo || '-',
    Estado: ESTADOS[s.estado],
    Registrados: `${s.registrados} / ${s.inscritos}`,
  }));
  const exportar = (tipo: 'pdf' | 'excel') => {
    if (!data) return;
    try {
      const periodoTexto = `${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`;
      if (tipo === 'pdf')
        exportToPDF({
          titulo: 'Control de pase de lista',
          subtitulo: data.tutor.nombre,
          fecha: periodoTexto,
          datos: filasExport,
          columnas: ['Fecha', 'Tipo', 'Actividad', 'Estado', 'Registrados'],
          headers: [
            'Fecha',
            'Tipo',
            'Actividad',
            'Estado',
            'Registrados / inscritos',
          ],
          totales: [
            {
              label: 'Días sin registro',
              value: data.estadisticas.diasSinRegistro,
            },
            {
              label: 'Listas sin registrar',
              value: data.estadisticas.sesionesSinRegistro,
            },
          ],
        });
      else
        exportToExcel({
          nombreArchivo: `Pase_lista_${data.tutor.nombre}_${periodoTexto}`,
          hojas: [
            {
              nombre: 'Información',
              datos: [
                {
                  Tutor: data.tutor.nombre,
                  Desde: data.periodo.fechaInicio,
                  Hasta: data.periodo.fechaFin,
                  Filtro: filtroEstado,
                  Nota: data.nota,
                },
              ],
            },
            { nombre: 'Pase de lista', datos: filasExport },
          ],
        });
    } catch {
      setError('No se pudo exportar el reporte.');
    }
  };
  return (
    <div className="space-y-5">
      <section className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold text-lg text-gray-900">
          Listas pendientes por tutor
        </h2>
        <p className="text-sm text-gray-600">
          Consulta los días programados de sus clases, clubs y cursos de
          Supervivencia que quedaron sin lista.
        </p>
        {error && <Alert variant="error">{error}</Alert>}
        {tutores.isError && (
          <Alert variant="error">
            No se pudieron cargar los tutores.{' '}
            <button className="underline" onClick={() => tutores.refetch()}>
              Reintentar
            </button>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tutor"
            value={tutorId}
            onChange={(e) => setTutorId(e.target.value)}
            disabled={tutores.isPending}
            options={(tutores.data ?? []).map((t) => ({
              value: t.id,
              label: `${t.nombre} ${t.apellido || ''}`.trim(),
            }))}
          />
          <Select
            label="Período"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as typeof periodo)}
            options={[
              { value: 'dia', label: 'Día específico' },
              { value: 'semana', label: 'Semana (lunes a domingo)' },
              { value: 'mes', label: 'Mes completo' },
              { value: 'rango', label: 'Rango de fechas' },
            ]}
          />
          {periodo === 'mes' && (
            <Input
              label="Mes"
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            />
          )}
          {(periodo === 'dia' || periodo === 'semana') && (
            <Input
              label={
                periodo === 'semana' ? 'Un día de la semana a consultar' : 'Día'
              }
              type="date"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
            />
          )}
          {periodo === 'rango' && (
            <>
              <Input
                label="Desde"
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
              <Input
                label="Hasta"
                type="date"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
              />
            </>
          )}
        </div>
        <Button
          onClick={generar}
          disabled={!tutorId}
          isLoading={reporte.isFetching}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Consultar
        </Button>
      </section>
      {reporte.isError && (
        <Alert variant="error">
          {isAxiosError<{ message?: string }>(reporte.error)
            ? reporte.error.response?.data?.message ||
              'No se pudo consultar el reporte.'
            : 'No se pudo consultar el reporte.'}
        </Alert>
      )}
      {data && !reporte.isFetching && !reporte.isError && (
        <section className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-5 space-y-3 border-b">
            <h3 className="text-lg font-bold text-gray-900">
              {data.tutor.nombre}
            </h3>
            <p className="text-sm text-gray-600">
              {format(parseISO(data.periodo.fechaInicio), 'dd/MM/yyyy')} al{' '}
              {format(parseISO(data.periodo.fechaFin), 'dd/MM/yyyy')}
            </p>
            <Alert>{data.nota}</Alert>
            {data.sesiones.length === 0 && (
              <Alert>
                No hay sesiones programadas con beneficiarios en este período.
                Para clubs y Supervivencia primero deben configurarse los
                encuentros.
              </Alert>
            )}
            <div className="flex flex-wrap items-end gap-3">
              <Select
                label="Mostrar"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                options={[
                  { value: 'sin_registro', label: 'Días en que no pasó lista' },
                  { value: 'parcial', label: 'Listas incompletas' },
                  { value: 'pendiente_hoy', label: 'Pendientes de hoy' },
                  { value: 'todos', label: 'Todas las sesiones' },
                ]}
              />
              <Button variant="outline" onClick={() => exportar('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => exportar('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
          <GraficoAsistencia
            stats={[
              {
                label: 'Días sin registro',
                value: data.estadisticas.diasSinRegistro,
              },
              {
                label: 'Listas sin registrar',
                value: data.estadisticas.sesionesSinRegistro,
              },
              {
                label: 'Listas incompletas',
                value: data.estadisticas.sesionesParciales,
              },
              {
                label: 'Listas registradas',
                value: data.estadisticas.sesionesRegistradas,
              },
            ]}
          />
          <ReporteEstadisticoTable
            headers={[
              'Fecha',
              'Tipo',
              'Actividad',
              'Estado',
              'Registrados / inscritos',
            ]}
            emptyMessage={
              filtroEstado === 'sin_registro'
                ? 'No hay días programados sin lista en el período consultado.'
                : 'No hay sesiones con este estado.'
            }
            rows={sesiones.map((s) => ({
              key: `${s.tipo}-${s.actividadId}-${s.fecha}`,
              cells: [
                <span key="fecha" className="whitespace-nowrap">
                  {format(parseISO(s.fecha), 'EEE dd/MM/yyyy', { locale: es })}
                </span>,
                TIPOS[s.tipo],
                s.actividad,
                <span
                  key="estado"
                  className={`font-semibold ${s.estado === 'sin_registro' ? 'text-red-600' : s.estado === 'parcial' ? 'text-amber-700' : 'text-gray-700'}`}
                >
                  {ESTADOS[s.estado]}
                </span>,
                `${s.registrados} / ${s.inscritos}`,
              ],
            }))}
          />
        </section>
      )}
    </div>
  );
}
