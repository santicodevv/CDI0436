'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DesembolsoFormModal from '@/components/desembolsos/DesembolsoFormModal';
import { useAuth } from '@/contexts/AuthContext';
import { useDesembolsos, useEliminarDesembolso } from '@/lib/hooks';
import type { Desembolso } from '@/lib/api/desembolsos';
import { fechaDdMmAaaa } from '@/lib/utils/formatters';
import { formatMontoRD } from '@/lib/utils/desembolsos';
import { Banknote, ChevronLeft, ChevronRight, Edit, Plus, Search, Trash2 } from 'lucide-react';

export default function DesembolsosPage() {
  const { tienePermiso } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [modal, setModal] = useState<{ desembolso: Desembolso | null } | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 15;

  const { data: desembolsos = [], isLoading } = useDesembolsos({
    buscar: busqueda || undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
  });
  const eliminarMutation = useEliminarDesembolso();

  const puedeCrear = tienePermiso('desembolsos:crear');
  const puedeEditar = tienePermiso('desembolsos:editar');
  const puedeEliminar = tienePermiso('desembolsos:eliminar');

  const total = useMemo(() => desembolsos.reduce((sum, d) => sum + Number(d.monto), 0), [desembolsos]);
  const totalPaginas = Math.ceil(desembolsos.length / itemsPorPagina);
  const paginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return desembolsos.slice(inicio, inicio + itemsPorPagina);
  }, [desembolsos, paginaActual]);

  const handleEliminar = async (d: Desembolso) => {
    if (confirm(`¿Eliminar el desembolso de ${d.nombre_beneficiario} por ${formatMontoRD(d.monto)}?`)) {
      await eliminarMutation.mutateAsync(d.id);
    }
  };

  const cambiarFiltro = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setPaginaActual(1);
  };

  return (
    <ProtectedRoute requiredPermisos={['desembolsos:ver']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Banknote className="w-7 h-7 text-emerald-600" />
                Desembolsos
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Ayudas económicas entregadas a beneficiarios. Cada registro aparece en la carpeta del beneficiario.
              </p>
            </div>
            {puedeCrear && (
              <button
                onClick={() => setModal({ desembolso: null })}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Registrar desembolso
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Registros</p>
              <p className="text-2xl font-bold text-gray-900">{desembolsos.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Monto total</p>
              <p className="text-2xl font-bold text-emerald-700">{formatMontoRD(total)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por beneficiario, código, referencia o detalle..."
                  value={busqueda}
                  onChange={cambiarFiltro(setBusqueda)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <label htmlFor="desde">Desde</label>
                <input id="desde" type="date" value={desde} onChange={cambiarFiltro(setDesde)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <label htmlFor="hasta">Hasta</label>
                <input id="hasta" type="date" value={hasta} onChange={cambiarFiltro(setHasta)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : desembolsos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Banknote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No hay desembolsos registrados</h3>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beneficiario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                      {(puedeEditar || puedeEliminar) && (
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginados.map((d) => (
                      <tr key={d.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{fechaDdMmAaaa(d.fecha)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">{d.detalle}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{d.codigo_beneficiario}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{d.nombre_beneficiario}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{d.referencia || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{d.cuenta || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">{formatMontoRD(d.monto)}</td>
                        {(puedeEditar || puedeEliminar) && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {puedeEditar && (
                                <button
                                  onClick={() => setModal({ desembolso: d })}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {puedeEliminar && (
                                <button
                                  onClick={() => handleEliminar(d)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Mostrando {(paginaActual - 1) * itemsPorPagina + 1} a{' '}
                    {Math.min(paginaActual * itemsPorPagina, desembolsos.length)} de {desembolsos.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                      disabled={paginaActual === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-700 px-2">
                      {paginaActual} / {totalPaginas}
                    </span>
                    <button
                      onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                      disabled={paginaActual === totalPaginas}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tienePermiso('beneficiarios:ver') && (
            <p className="text-xs text-gray-400">
              Para ver los desembolsos de una persona, abre su carpeta en{' '}
              <Link href="/dashboard/beneficiarios" className="underline hover:text-gray-600">Beneficiarios</Link>.
            </p>
          )}
        </div>

        {modal && <DesembolsoFormModal desembolso={modal.desembolso} onClose={() => setModal(null)} />}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
