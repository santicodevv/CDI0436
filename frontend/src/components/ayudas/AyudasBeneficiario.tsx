'use client';

import { useState } from 'react';
import { HandHeart } from 'lucide-react';
import { useAyudasBeneficiario } from '@/lib/hooks';
import type { Ayuda, EstadoFiltroAyuda } from '@/lib/types';

const TIPO_LABEL: Record<Ayuda['tipo'], string> = {
  medica: 'Médica',
  alimentos: 'Alimentos',
  pequeno_negocio: 'Peq. Negocio',
  educacion: 'Educación',
  otros: 'Otros',
};

const ESTADO_BADGE: Record<Ayuda['estado'], string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobada: 'bg-green-100 text-green-800',
  rechazada: 'bg-red-100 text-red-800',
};

const FILTROS_ESTADO: { key: EstadoFiltroAyuda; label: string }[] = [
  { key: 'todos', label: 'Todas' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'aprobada', label: 'Aprobadas' },
  { key: 'rechazada', label: 'Rechazadas' },
];

interface AyudasBeneficiarioProps {
  codigoBeneficiario: string;
}

export default function AyudasBeneficiario({ codigoBeneficiario }: AyudasBeneficiarioProps) {
  const { data: ayudas = [], isLoading } = useAyudasBeneficiario(codigoBeneficiario);
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltroAyuda>('todos');

  const conteo = (estado: EstadoFiltroAyuda) =>
    estado === 'todos' ? ayudas.length : ayudas.filter(a => a.estado === estado).length;
  const ayudasFiltradas = filtroEstado === 'todos' ? ayudas : ayudas.filter(a => a.estado === filtroEstado);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <HandHeart className="w-5 h-5 text-rose-600" />
          Solicitudes de ayuda
        </h2>
        <div className="flex gap-1.5 flex-wrap">
          {FILTROS_ESTADO.map(f => {
            const isActive = filtroEstado === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFiltroEstado(f.key)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {f.label} ({conteo(f.key)})
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
        </div>
      ) : ayudasFiltradas.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          {ayudas.length === 0
            ? 'Este beneficiario no tiene solicitudes de ayuda.'
            : 'No hay solicitudes con este estado.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Solicitó</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ayudasFiltradas.map(a => (
                <tr key={a.id}>
                  <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                    {new Date(a.creado_en).toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {a.tipo === 'otros' && a.tipo_especificacion ? `Otros: ${a.tipo_especificacion}` : TIPO_LABEL[a.tipo]}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">{a.detalle}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{a.nombre_madre}</td>
                  <td className="px-3 py-2 text-sm">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${ESTADO_BADGE[a.estado]}`}>
                      {a.estado.charAt(0).toUpperCase() + a.estado.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
