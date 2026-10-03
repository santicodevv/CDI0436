'use client';

import { useState, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import { useAyudas, useUpdateEstadoAyuda, useDeleteAyuda, useComentariosAyuda, useCreateComentarioAyuda, useUpdateFotoEntregaAyuda, useExportAyudas } from '@/lib/hooks';
import { AyudaStats } from '@/components/ayudas/AyudaStats';
import { AyudaFilters } from '@/components/ayudas/AyudaFilters';
import { AyudaCard } from '@/components/ayudas/AyudaCard';
import tableStyles from '@/components/ayudas/AyudaCard.module.css';
import { AyudaComentarios } from '@/components/ayudas/AyudaComentarios';
import { AyudaModal } from '@/components/ayudas/AyudaModal';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Ayuda, EstadoFiltroAyuda } from '@/lib/types';

const ITEMS_POR_PAGINA = 10;

export default function AyudasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltroAyuda>('pendiente');
  const [fotoModal, setFotoModal] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const tableHeaderRef = useRef<HTMLTableRowElement>(null);

  // Comentarios
  const [comentariosModal, setComentariosModal] = useState<Ayuda | null>(null);

  // Foto entrega
  const [fotoEntregaModal, setFotoEntregaModal] = useState<Ayuda | null>(null);
  const [fotoEntregaPreview, setFotoEntregaPreview] = useState<string | null>(null);
  const [fotoEntregaModalView, setFotoEntregaModalView] = useState<string | null>(null);

  // Hooks
  const { data: ayudas = [], isLoading, error } = useAyudas();
  const updateEstado = useUpdateEstadoAyuda();
  const deleteAyuda = useDeleteAyuda();
  const { data: comentarios = [], isLoading: loadingComentarios } = useComentariosAyuda(comentariosModal?.id ?? '');
  const createComentario = useCreateComentarioAyuda();
  const updateFotoEntrega = useUpdateFotoEntregaAyuda();
  const exportAyudas = useExportAyudas();

  // Computed
  const countByEstado = useMemo(() => ({
    pendiente: ayudas.filter((a) => a.estado === 'pendiente').length,
    aprobada: ayudas.filter((a) => a.estado === 'aprobada').length,
    rechazada: ayudas.filter((a) => a.estado === 'rechazada').length,
    todos: ayudas.length,
  }), [ayudas]);

  const filteredAyudas = useMemo(() =>
    ayudas.filter((a) => {
      const matchSearch =
        a.nombre_beneficiario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.codigo_beneficiario.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado = estadoFiltro === 'todos' || a.estado === estadoFiltro;
      return matchSearch && matchEstado;
    }),
    [ayudas, searchTerm, estadoFiltro]
  );

  const totalPaginas = Math.max(1, Math.ceil(filteredAyudas.length / ITEMS_POR_PAGINA));
  const paginaVisible = Math.min(paginaActual, totalPaginas);
  const inicio = (paginaVisible - 1) * ITEMS_POR_PAGINA;
  const ayudasPaginadas = filteredAyudas.slice(inicio, inicio + ITEMS_POR_PAGINA);
  const paginas = Array.from({ length: totalPaginas }, (_, index) => index + 1)
    .filter((pagina) => pagina === 1 || pagina === totalPaginas || Math.abs(pagina - paginaVisible) <= 1);

  // Handlers
  const handleEstado = async (id: string, estado: 'aprobada' | 'rechazada') => {
    if (!confirm(`¿Estás seguro de ${estado === 'aprobada' ? 'aprobar' : 'rechazar'} esta solicitud?`)) return;
    updateEstado.mutate({ id, estado });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta solicitud?')) return;
    deleteAyuda.mutate(id);
  };

  const handleExport = () => {
    exportAyudas.mutate(undefined, {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ayudas_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      },
      onError: () => alert('Error al exportar'),
    });
  };

  const handleAddComentario = (contenido: string) => {
    if (!comentariosModal) return;
    createComentario.mutate(
      { ayudaId: comentariosModal.id, data: { contenido, autor: 'Administrador' } },
      { onError: () => alert('Error al agregar comentario') }
    );
  };

  const handleFotoEntregaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Por favor selecciona una imagen válida'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('La imagen no puede ser mayor a 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setFotoEntregaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubirFotoEntrega = () => {
    if (!fotoEntregaPreview || !fotoEntregaModal) return;
    updateFotoEntrega.mutate(
      { id: fotoEntregaModal.id, fotoUrl: fotoEntregaPreview },
      {
        onSuccess: () => { setFotoEntregaModal(null); setFotoEntregaPreview(null); },
        onError: () => alert('Error al subir la foto de entrega'),
      }
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Solicitudes de Ayuda</h1>
            <p className="text-gray-600 mt-1">Administra las solicitudes registradas por los beneficiarios</p>
          </div>

          {error && <Alert variant="error">{(error as Error)?.message || 'Error al cargar las solicitudes'}</Alert>}

          <AyudaStats {...countByEstado} />

          <AyudaFilters
            estadoFiltro={estadoFiltro}
            onEstadoChange={(estado) => { setEstadoFiltro(estado); setPaginaActual(1); }}
            searchTerm={searchTerm}
            onSearchChange={(search) => { setSearchTerm(search); setPaginaActual(1); }}
            counts={countByEstado}
            onExport={handleExport}
          />

          <div className="min-w-0 bg-white rounded-lg shadow-md border border-gray-100">
            <p className="border-b border-gray-100 px-4 py-3 text-xs text-gray-500">
              Arrastra una fila hacia los lados para ver su información. También puedes usar su barra de desplazamiento.
            </p>
            <div className="min-w-0">
              <table key={`${paginaVisible}-${estadoFiltro}-${searchTerm}`} className="block w-full" aria-label="Solicitudes de ayuda">
                <thead className="block w-full">
                  <tr ref={tableHeaderRef} className={tableStyles.header}>
                    {['Código', 'Beneficiario', 'Teléfono', 'Tipo', 'Detalle', 'Estado', 'Fecha', 'Acciones'].map((h) => (
                      <th
                        key={h}
                        scope="col"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="block w-full bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr className="block">
                      <td colSpan={8} className="block px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                          <p>Cargando solicitudes...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAyudas.length === 0 ? (
                    <tr className="block">
                      <td colSpan={8} className="block px-6 py-12 text-center text-gray-500">
                        No se encontraron solicitudes {estadoFiltro !== 'todos' ? estadoFiltro + 's' : ''}.
                      </td>
                    </tr>
                  ) : (
                    ayudasPaginadas.map((ayuda) => (
                      <AyudaCard
                        key={ayuda.id}
                        ayuda={ayuda}
                        onViewFoto={setFotoModal}
                        onOpenComentarios={setComentariosModal}
                        onUploadFotoEntrega={setFotoEntregaModal}
                        onViewFotoEntrega={setFotoEntregaModalView}
                        onAprobar={(id) => handleEstado(id, 'aprobada')}
                        onRechazar={(id) => handleEstado(id, 'rechazada')}
                        onDelete={handleDelete}
                        onScrollPositionChange={(scrollLeft) => {
                          if (tableHeaderRef.current) tableHeaderRef.current.scrollLeft = scrollLeft;
                        }}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!isLoading && filteredAyudas.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3">
                <p className="text-sm text-gray-600" aria-live="polite">
                  Mostrando {inicio + 1} a {Math.min(inicio + ITEMS_POR_PAGINA, filteredAyudas.length)} de {filteredAyudas.length} solicitudes
                </p>
                <nav aria-label="Paginación de solicitudes" className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => setPaginaActual(paginaVisible - 1)}
                    disabled={paginaVisible === 1}
                    aria-label="Página anterior"
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {paginas.map((pagina, index) => (
                    <span key={pagina} className="flex items-center gap-1">
                      {index > 0 && pagina - paginas[index - 1] > 1 && (
                        <span className="px-1 text-gray-400" aria-hidden="true">…</span>
                      )}
                      <button
                        onClick={() => setPaginaActual(pagina)}
                        aria-label={`Página ${pagina}`}
                        aria-current={paginaVisible === pagina ? 'page' : undefined}
                        className={`min-w-8 h-8 px-1 rounded-lg text-sm font-medium transition-colors ${
                          paginaVisible === pagina ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pagina}
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => setPaginaActual(paginaVisible + 1)}
                    disabled={paginaVisible === totalPaginas}
                    aria-label="Página siguiente"
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Modal para comentarios */}
        <Modal
          isOpen={!!comentariosModal}
          onClose={() => {
            setComentariosModal(null);
          }}
          title={comentariosModal ? `Comentarios - ${comentariosModal.nombre_beneficiario}` : 'Comentarios'}
          size="md"
        >
          <AyudaComentarios
            ayuda={comentariosModal}
            comentarios={comentarios}
            loading={loadingComentarios}
            onAddComentario={handleAddComentario}
            onClose={() => setComentariosModal(null)}
          />
        </Modal>

        {/* Modales de fotos */}
        <AyudaModal
          fotoModal={fotoModal}
          onCloseFoto={() => setFotoModal(null)}
          fotoEntregaModal={fotoEntregaModal}
          fotoEntregaPreview={fotoEntregaPreview}
          loadingFotoEntrega={updateFotoEntrega.isPending}
          onFotoEntregaSelect={handleFotoEntregaSelect}
          onSubirFotoEntrega={handleSubirFotoEntrega}
          onCancelFotoEntrega={() => {
            setFotoEntregaModal(null);
            setFotoEntregaPreview(null);
          }}
          fotoEntregaModalView={fotoEntregaModalView}
          onCloseFotoEntregaView={() => setFotoEntregaModalView(null)}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
