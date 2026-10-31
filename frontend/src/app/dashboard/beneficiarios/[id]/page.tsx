'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import PerfilInfo from '@/components/beneficiarios/PerfilInfo';
import EstadisticasCard from '@/components/beneficiarios/EstadisticasCard';
import ExpedienteList from '@/components/beneficiarios/ExpedienteList';
import FotoGallery from '@/components/beneficiarios/FotoGallery';
import AgregarExpedienteModal from '@/components/beneficiarios/AgregarExpedienteModal';
import EditarExpedienteModal from '@/components/beneficiarios/EditarExpedienteModal';
import EditarPerfilModal from '@/components/beneficiarios/EditarPerfilModal';
import DesembolsosBeneficiario from '@/components/desembolsos/DesembolsosBeneficiario';
import AyudasBeneficiario from '@/components/ayudas/AyudasBeneficiario';
import type { SeccionExtra } from '@/components/beneficiarios/ExpedienteList';
import { useAuth } from '@/contexts/AuthContext';
import {
  useBeneficiario,
  useExpedientes,
  useUpdateBeneficiario,
  useToggleEstadoBeneficiario,
  useAddExpediente,
  useUpdateExpediente,
  useDeleteExpediente,
} from '@/lib/hooks/useBeneficiarios';
import { useAyudasBeneficiario, useDesembolsosBeneficiario } from '@/lib/hooks';
import type { Beneficiario, ExpedienteEntry, ExpedientePayload, ExpedienteEditPayload } from '@/lib/types';
import { ArrowLeft, Edit, Power } from 'lucide-react';
import { calcularEdad } from '@/lib/utils/formatters';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BeneficiarioDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tienePermiso } = useAuth();

  const beneficiarioId = id as string;
  const puedeVerAyudas = tienePermiso('ayudas:ver');
  const puedeVerDesembolsos = tienePermiso('desembolsos:ver');

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: beneficiario, isLoading: loadingBeneficiario } = useBeneficiario(beneficiarioId);
  const { data: expedientes = [], isLoading: loadingExpedientes } = useExpedientes(beneficiarioId);
  const { data: ayudas = [] } = useAyudasBeneficiario(beneficiario?.codigo ?? '', puedeVerAyudas);
  const { data: desembolsos = [] } = useDesembolsosBeneficiario(beneficiarioId, puedeVerDesembolsos);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateBeneficiario = useUpdateBeneficiario();
  const toggleEstado = useToggleEstadoBeneficiario();
  const addExpediente = useAddExpediente();
  const updateExpediente = useUpdateExpediente();
  const deleteExpediente = useDeleteExpediente();

  // ── Local state ───────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [entradaEditar, setEntradaEditar] = useState<ExpedienteEntry | null>(null);
  const [showFotoPerfil, setShowFotoPerfil] = useState(false);
  const [showEditPerfil, setShowEditPerfil] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSavePerfil = useCallback(async (data: Partial<Beneficiario> & { newFotoBase64?: string }) => {
    if (!beneficiario) return;
    const { newFotoBase64, ...rest } = data;
    const payload: Record<string, unknown> = { ...rest };
    if (newFotoBase64) payload.foto_url = newFotoBase64;
    await updateBeneficiario.mutateAsync({ id: beneficiario.id, data: payload as Partial<Beneficiario> });
    setShowEditPerfil(false);
  }, [beneficiario, updateBeneficiario]);

  const handleToggleEstado = useCallback(async () => {
    if (!beneficiario) return;
    try {
      await toggleEstado.mutateAsync(beneficiario.id);
    } catch {
      alert('Hubo un error al cambiar el estado del beneficiario.');
    }
  }, [beneficiario, toggleEstado]);

  const handleSaveExpediente = useCallback(async (data: ExpedientePayload) => {
    await addExpediente.mutateAsync({ id: beneficiarioId, data: data as unknown as Record<string, unknown> });
    setShowAddModal(false);
  }, [beneficiarioId, addExpediente]);

  const handleUpdateExpediente = useCallback(async (data: ExpedienteEditPayload) => {
    if (!entradaEditar) return;
    await updateExpediente.mutateAsync({ expedienteId: entradaEditar.id, data: data as unknown as Record<string, unknown> });
    setEntradaEditar(null);
  }, [entradaEditar, updateExpediente]);

  const handleDeleteExpediente = useCallback(async (expId: string) => {
    if (!confirm('¿Eliminar esta entrada del expediente?')) return;
    await deleteExpediente.mutateAsync(expId);
  }, [deleteExpediente]);

  // ── Derived values ────────────────────────────────────────────────────────
  const isLoading = loadingBeneficiario || loadingExpedientes;
  const edad = beneficiario ? calcularEdad(beneficiario.fecha_nacimiento) : null;
  const claseActiva = beneficiario?.clases?.find(c => c.activo);
  const cursoActivo = beneficiario?.supervivencias?.find(s => s.activo);
  const tutorClase = claseActiva?.tutor
    ? `${claseActiva.tutor.nombre} ${claseActiva.tutor.apellido || ''}`.trim()
    : 'No asignado';
  const puedeEditar = tienePermiso('beneficiarios:editar');

  const seccionesExtra: SeccionExtra[] = [];
  if (beneficiario && puedeVerAyudas) {
    seccionesExtra.push({
      key: 'solicitudes',
      label: 'Solicitudes de ayuda',
      count: ayudas.length,
      content: <AyudasBeneficiario codigoBeneficiario={beneficiario.codigo} />,
    });
  }
  if (beneficiario && puedeVerDesembolsos) {
    seccionesExtra.push({
      key: 'desembolsos',
      label: 'Ayuda ADI',
      count: desembolsos.length,
      content: <DesembolsosBeneficiario beneficiarioId={beneficiario.id} />,
    });
  }

  return (
    <ProtectedRoute requiredPermisos={['beneficiarios:ver']}>
      <DashboardLayout>
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Not found */}
        {!isLoading && !beneficiario && (
          <div className="text-center py-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Beneficiario no encontrado</h2>
            <Button onClick={() => router.push('/dashboard/beneficiarios')}>Volver</Button>
          </div>
        )}

        {/* Content */}
        {!isLoading && beneficiario && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/dashboard/beneficiarios')}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Volver a la cuadrícula
              </button>
              <div className="flex gap-2">
                {puedeEditar && (
                  <Button
                    variant="outline"
                    onClick={handleToggleEstado}
                    isLoading={toggleEstado.isPending}
                    className={`flex items-center gap-2 text-sm ${beneficiario.activo ? 'text-red-600 hover:bg-red-50 border-red-200' : 'text-green-600 hover:bg-green-50 border-green-200'}`}
                  >
                    <Power className="w-4 h-4" />
                    {beneficiario.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowEditPerfil(true)} className="flex items-center gap-2 text-sm">
                  <Edit className="w-4 h-4" /> Editar Perfil
                </Button>
              </div>
            </div>

            {/* Perfil Info Card */}
            <PerfilInfo
              beneficiario={beneficiario}
              expedientesLength={expedientes.length}
              edad={edad}
              tutorClase={tutorClase}
              onFotoClick={() => setShowFotoPerfil(true)}
            />

            {/* Clase Académica & Curso de Supervivencia */}
            <EstadisticasCard claseActiva={claseActiva} cursoActivo={cursoActivo} />

            {/* Expediente Digital */}
            <ExpedienteList
              expedientes={expedientes}
              seccionesExtra={seccionesExtra}
              onAdd={() => setShowAddModal(true)}
              onEdit={setEntradaEditar}
              onDelete={handleDeleteExpediente}
              beneficiarioNombre={beneficiario.nombre}
            />
          </div>
        )}

        {/* Modales */}
        <AgregarExpedienteModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveExpediente}
        />
        <EditarExpedienteModal
          isOpen={!!entradaEditar}
          entrada={entradaEditar}
          onClose={() => setEntradaEditar(null)}
          onSave={handleUpdateExpediente}
        />
        {showEditPerfil && beneficiario && (
          <EditarPerfilModal
            beneficiario={beneficiario}
            onClose={() => setShowEditPerfil(false)}
            onSave={handleSavePerfil}
          />
        )}

        {/* Profile photo lightbox */}
        <FotoGallery
          isOpen={showFotoPerfil}
          fotoUrl={beneficiario?.foto_url || ''}
          nombre={beneficiario?.nombre || ''}
          onClose={() => setShowFotoPerfil(false)}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
