'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useBonosRegalos, useBonosEstadisticas, useBonosMeses, useMarcarEntregado, useEliminarBono } from '@/lib/hooks';
import type { BonoRegalo } from '@/lib/api/bonos';
import {
  Gift,
  Search,
  CheckCircle,
  Clock,
  Package,
  Camera,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function ListaRegalosPage() {
  const [filtroEntregado, setFiltroEntregado] = useState<boolean | undefined>(undefined);
  const [filtroMes, setFiltroMes] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [fotoModal, setFotoModal] = useState<BonoRegalo | null>(null);
  const [previewModal, setPreviewModal] = useState<BonoRegalo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const { data: bonos = [], isLoading } = useBonosRegalos({
    entregado: filtroEntregado,
    mes: filtroMes || undefined,
    buscar: busqueda || undefined,
  });

  const totalPaginas = Math.ceil(bonos.length / itemsPorPagina);
  const bonosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return bonos.slice(inicio, inicio + itemsPorPagina);
  }, [bonos, paginaActual]);

  const { data: stats } = useBonosEstadisticas();
  const { data: meses = [] } = useBonosMeses();
  const marcarEntregadoMutation = useMarcarEntregado();
  const eliminarMutation = useEliminarBono();

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleEntregar = async () => {
    if (!fotoModal) return;
    await marcarEntregadoMutation.mutateAsync({
      id: fotoModal.id,
      foto: selectedFile || undefined,
    });
    setFotoModal(null);
    setSelectedFile(null);
  };

  const handleEliminar = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este bono?')) {
      await eliminarMutation.mutateAsync(id);
    }
  };

  return (
    <ProtectedRoute requiredPermisos={['bonos:ver']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-7 h-7 text-purple-600" />
              Lista de Regalos
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Visualiza los bonos pendientes de entrega y sube la foto al entregarlos.
            </p>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Bonos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Gift className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pendientes}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Entregados</p>
                    <p className="text-2xl font-bold text-green-600">{stats.entregados}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monto Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      RD${stats.monto_total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre del beneficiario..."
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <select
                  value={filtroMes}
                  onChange={(e) => { setFiltroMes(e.target.value); setPaginaActual(1); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Todos los meses</option>
                  {meses.map((mes) => (
                    <option key={mes} value={mes}>{mes}</option>
                  ))}
                </select>
              </div>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => { setFiltroEntregado(undefined); setPaginaActual(1); }}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    filtroEntregado === undefined
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => { setFiltroEntregado(false); setPaginaActual(1); }}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    filtroEntregado === false
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Pendientes
                </button>
                <button
                  onClick={() => { setFiltroEntregado(true); setPaginaActual(1); }}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    filtroEntregado === true
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Entregados
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : bonos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No hay bonos registrados</h3>
              <p className="text-gray-600 mt-1">
                Ve a &quot;Bonos de Regalos&quot; para subir un Excel y guardar bonos.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beneficiario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Padre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bonosPaginados.map((bono) => (
                      <tr key={bono.id} className={bono.entregado ? 'bg-green-50' : ''}>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{bono.codigo}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{bono.beneficiario_nombre}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{bono.padre_nombre || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{bono.cedula || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          RD${bono.monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{bono.mes}</td>
                        <td className="px-4 py-3">
                          {bono.entregado ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" />
                              Entregado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Clock className="w-3 h-3" />
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {bono.foto_entrega && (
                              <button
                                onClick={() => setPreviewModal(bono)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Ver foto de entrega"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {!bono.entregado && (
                              <button
                                onClick={() => {
                                  setFotoModal(bono);
                                  setSelectedFile(null);
                                }}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                title="Marcar como entregado"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEliminar(bono.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Mostrando {(paginaActual - 1) * itemsPorPagina + 1} a{' '}
                    {Math.min(paginaActual * itemsPorPagina, bonos.length)} de {bonos.length} bonos
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                      disabled={paginaActual === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                      <button
                        key={pagina}
                        onClick={() => setPaginaActual(pagina)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          paginaActual === pagina
                            ? 'bg-purple-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pagina}
                      </button>
                    ))}
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
        </div>

        {fotoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Entregar Bono</h3>
                <button onClick={() => setFotoModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p><span className="font-medium">Beneficiario:</span> {fotoModal.beneficiario_nombre}</p>
                <p><span className="font-medium">Código:</span> {fotoModal.codigo}</p>
                <p><span className="font-medium">Monto:</span> RD${fotoModal.monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto de entrega (opcional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelectFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors"
                >
                  <Camera className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : 'Seleccionar foto'}
                  </span>
                </button>
                {selectedFile && (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="mt-2 w-full h-40 object-cover rounded-lg"
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setFotoModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEntregar}
                  disabled={marcarEntregadoMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {marcarEntregadoMutation.isPending ? 'Guardando...' : 'Marcar Entregado'}
                </button>
              </div>
            </div>
          </div>
        )}

        {previewModal && previewModal.foto_entrega && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Foto de Entrega</h3>
                <button onClick={() => setPreviewModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Beneficiario:</span> {previewModal.beneficiario_nombre}</p>
                <p><span className="font-medium">Código:</span> {previewModal.codigo}</p>
              </div>
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${previewModal.foto_entrega}`}
                alt="Foto de entrega"
                className="w-full rounded-lg object-cover"
              />
              <button
                onClick={() => setPreviewModal(null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
