'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { clasesApi } from '@/lib/api/clases';
import { beneficiariosApi } from '@/lib/api/beneficiarios';
import { tutoresApi } from '@/lib/api/tutores';
import { FileDown, FileSpreadsheet, Calendar } from 'lucide-react';
import { fechaDdMmAaaa, nombreMesAnio } from '@/lib/utils/formatters';
import type { FiltrosReportePayload, TipoFiltroFecha } from '@/lib/types';

interface FiltrosReporteProps {
  tipoReporte: 'clase' | 'beneficiario' | 'tutor';
  onGenerar: (filtros: FiltrosReportePayload) => void;
  isLoading?: boolean;
}

export default function FiltrosReporte({ tipoReporte, onGenerar, isLoading }: FiltrosReporteProps) {
  const [filtros, setFiltros] = useState({
    id: '',
    tipoFiltroFecha: 'todo' as TipoFiltroFecha,
    fecha: '',
    fechaInicio: '',
    fechaFin: '',
    mes: new Date().toLocaleDateString('en-CA').slice(0, 7), // formato: YYYY-MM
  });
  // La lista de asistencia de una clase siempre es mensual.
  const soloMes = tipoReporte === 'clase';
  // El pase de lista del tutor necesita un periodo acotado (hasta un año).
  const sinHistorial = tipoReporte === 'tutor';
  const tipoFiltroFecha =
    soloMes || (sinHistorial && filtros.tipoFiltroFecha === 'todo') ? 'mes' : filtros.tipoFiltroFecha;
  const [opciones, setOpciones] = useState<{ value: string; label: string }[]>([]);

  const loadOpciones = async () => {
    try {
      if (tipoReporte === 'clase') {
        const clases = await clasesApi.getAll();
        setOpciones(clases.map(c => ({
          value: c.id,
          label: `${c.nombre} ${c.codigo ? `(${c.codigo})` : ''}`
        })));
      } else if (tipoReporte === 'beneficiario') {
        const beneficiarios = await beneficiariosApi.getAll();
        setOpciones(beneficiarios.map(b => ({
          value: b.id,
          label: `${b.nombre} ${b.apellido || ''} (${b.codigo})`
        })));
      } else if (tipoReporte === 'tutor') {
        const tutores = await tutoresApi.getAll();
        setOpciones(tutores.map(t => ({
          value: t.id,
          label: `${t.nombre} ${t.apellido || ''}`.trim()
        })));
      }
    } catch (error) {
      console.error('Error al cargar opciones:', error);
    }
  };

  useEffect(() => {
    // Async state updates from an effect are safe — they don't cascade renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOpciones();
  }, [tipoReporte]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleGenerar = () => {
    if (!filtros.id) {
      alert(`Por favor selecciona ${tipoReporte === 'clase' ? 'una clase' : tipoReporte === 'beneficiario' ? 'un beneficiario' : 'un tutor'}`);
      return;
    }
    if ((soloMes || sinHistorial) && tipoFiltroFecha === 'mes' && !filtros.mes) {
      alert('Por favor selecciona un mes');
      return;
    }

    let fechaInicio: string | undefined;
    let fechaFin: string | undefined;
    let fechaReporte: string | undefined;

    switch (tipoFiltroFecha) {
      case 'fecha':
        fechaInicio = filtros.fecha || undefined;
        fechaFin = filtros.fecha || undefined;
        fechaReporte = filtros.fecha ? fechaDdMmAaaa(filtros.fecha) : undefined;
        break;
      case 'rango':
        fechaInicio = filtros.fechaInicio || undefined;
        fechaFin = filtros.fechaFin || undefined;
        if (fechaInicio && fechaFin) {
          fechaReporte = `${fechaDdMmAaaa(fechaInicio)} al ${fechaDdMmAaaa(fechaFin)}`;
        }
        break;
      case 'mes':
        if (filtros.mes) {
          const [year, month] = filtros.mes.split('-');
          const ultimoDia = new Date(parseInt(year), parseInt(month), 0);
          fechaInicio = `${filtros.mes}-01`;
          fechaFin = `${filtros.mes}-${String(ultimoDia.getDate()).padStart(2, '0')}`;
          fechaReporte = nombreMesAnio(fechaInicio);
        }
        break;
      case 'todo':
      default:
        // Sin fechas, trae todo el historial
        fechaReporte = 'Todo el historial';
        break;
    }

    if (sinHistorial) {
      if (!fechaInicio || !fechaFin) {
        alert('Selecciona el periodo del reporte');
        return;
      }
      const dias = (Date.parse(fechaFin) - Date.parse(fechaInicio)) / 86400000;
      if (dias < 0 || dias > 366) {
        alert('Selecciona un rango válido de hasta un año');
        return;
      }
    }

    const filtrosConFecha = {
      id: filtros.id,
      fechaInicio,
      fechaFin,
      fechaReporte, // Fecha para mostrar en el reporte
    };
    onGenerar(filtrosConFecha);
  };

  const tipoFiltroOpciones = [
    { value: 'todo', label: 'Todo el historial' },
    { value: 'fecha', label: 'Fecha específica' },
    { value: 'rango', label: 'Rango de fechas' },
    { value: 'mes', label: 'Mes completo' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Filtros del Reporte
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label={tipoReporte === 'clase' ? 'Seleccionar Clase *' : tipoReporte === 'beneficiario' ? 'Seleccionar Beneficiario *' : 'Seleccionar Tutor *'}
          name="id"
          value={filtros.id}
          onChange={handleChange}
          options={opciones}
          required
        />

        {soloMes ? (
          <Input
            label="Seleccionar mes *"
            name="mes"
            type="month"
            value={filtros.mes}
            onChange={handleChange}
          />
        ) : (
          <Select
            label="Filtrar por fecha"
            name="tipoFiltroFecha"
            value={tipoFiltroFecha}
            onChange={handleChange}
            options={sinHistorial ? tipoFiltroOpciones.filter((o) => o.value !== 'todo') : tipoFiltroOpciones}
          />
        )}
      </div>

      {/* Campos de fecha según el tipo de filtro */}
      {tipoFiltroFecha === 'fecha' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha"
            name="fecha"
            type="date"
            value={filtros.fecha}
            onChange={handleChange}
          />
        </div>
      )}

      {tipoFiltroFecha === 'rango' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha inicio"
            name="fechaInicio"
            type="date"
            value={filtros.fechaInicio}
            onChange={handleChange}
          />
          <Input
            label="Fecha fin"
            name="fechaFin"
            type="date"
            value={filtros.fechaFin}
            onChange={handleChange}
          />
        </div>
      )}

      {!soloMes && tipoFiltroFecha === 'mes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Seleccionar mes"
            name="mes"
            type="month"
            value={filtros.mes}
            onChange={handleChange}
          />
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <Button
          onClick={() => handleGenerar()}
          disabled={isLoading || !filtros.id}
          className="flex items-center gap-2 px-8"
        >
          <Calendar className="w-4 h-4" />
          Ver Reporte
        </Button>
      </div>
    </div>
  );
}