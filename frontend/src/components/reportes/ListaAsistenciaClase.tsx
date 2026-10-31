'use client';

import { Check } from 'lucide-react';
import { nombreMesAnio } from '@/lib/utils/formatters';
import type { ReporteAsistenciaClase } from '@/lib/types';

interface ListaAsistenciaClaseProps {
  data: ReporteAsistenciaClase;
}

export default function ListaAsistenciaClase({ data }: ListaAsistenciaClaseProps) {
  const { clase, periodo, fechas, beneficiarios } = data;

  return (
    <div className="p-6 space-y-4">
      <div className="text-sm text-gray-700 space-y-1">
        <p className="font-bold text-gray-900">{nombreMesAnio(periodo.fechaInicio)}</p>
        <div className="flex flex-col sm:flex-row sm:gap-8">
          <p><span className="font-semibold">Sección:</span> {clase.nombre}. {clase.horarios}</p>
          <p><span className="font-semibold">Tutor:</span> {clase.tutor || 'Sin tutor'}</p>
        </div>
      </div>

      <h3 className="text-center font-bold text-gray-900">Lista de Asistencia</h3>

      {beneficiarios.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-8">La clase no tiene beneficiarios inscritos.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left font-semibold border-b border-r border-gray-300 w-20">Número</th>
                <th className="px-3 py-2 text-left font-semibold border-b border-r border-gray-300">Beneficiario</th>
                {fechas.map((fecha) => (
                  <th key={fecha} className="px-2 py-2 text-center font-semibold border-b border-r border-gray-300 w-12 last:border-r-0">
                    {fecha.slice(8, 10)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {beneficiarios.map((b) => {
                const presentes = new Set(b.presentes);
                return (
                  <tr key={b.id} className="hover:bg-blue-50/50">
                    <td className="px-3 py-1.5 font-mono text-xs border-b border-r border-gray-200">{b.codigo}</td>
                    <td className="px-3 py-1.5 text-gray-900 border-b border-r border-gray-200">{b.nombre}</td>
                    {fechas.map((fecha) => (
                      <td key={fecha} className="px-2 py-1.5 border-b border-r border-gray-200 last:border-r-0">
                        {presentes.has(fecha) && <Check className="w-4 h-4 mx-auto text-green-700" aria-label="Presente" />}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {fechas.length === 0 && beneficiarios.length > 0 && (
        <p className="text-sm text-amber-700">
          La clase no tiene días configurados en su horario ni listas registradas en este mes.
        </p>
      )}
    </div>
  );
}
