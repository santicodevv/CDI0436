'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import AgregarBeneficiariosClubModal from '@/components/clubs/AgregarBeneficiariosClubModal';
import ClubInfo from '@/components/clubs/ClubInfo';
import ClubStats from '@/components/clubs/ClubStats';
import ClubBeneficiarios from '@/components/clubs/ClubBeneficiarios';
import ClubAsistencias from '@/components/clubs/ClubAsistencias';
import ClubEncuentros from '@/components/clubs/ClubEncuentros';
import { useAuth } from '@/contexts/AuthContext';
import { useClub, useFechasConAsistenciaClub, useAsistenciasClub, useAgregarBeneficiariosClub, useEncuentrosClub } from '@/lib/hooks/useClubs';
import { ArrowLeft, UserPlus, Users, ClipboardCheck, Trophy, Clock, Calendar } from 'lucide-react';

export default function ClubDetallePage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;
  const { tienePermiso } = useAuth();
  const puedeEditar = tienePermiso('clubs:editar');

  const [activeTab, setActiveTab] = useState<'beneficiarios' | 'asistencia' | 'encuentros'>('beneficiarios');
  const [mesEncuentros, setMesEncuentros] = useState(() => format(new Date(), 'yyyy-MM'));
  const [showAgregarModal, setShowAgregarModal] = useState(false);

  // Queries
  const { data: club, isLoading, error } = useClub(clubId);
  const { data: fechasConAsistencia = [] } = useFechasConAsistenciaClub(clubId);

  // Today's attendance for the stats card
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: encuentrosActuales } = useEncuentrosClub(clubId, today.slice(0, 7));
  const hayEncuentroHoy = encuentrosActuales?.fechas.includes(today) ?? false;
  const { data: todayAsistencia } = useAsistenciasClub(clubId, hayEncuentroHoy ? today : '');

  // Mutations
  const agregarMutation = useAgregarBeneficiariosClub();

  const handleAgregarBeneficiarios = async (beneficiarioIds: string[]) => {
    await agregarMutation.mutateAsync({ id: clubId, beneficiarioIds });
    setShowAgregarModal(false);
  };

  const queryError = error
    ? error instanceof Error
      ? error.message
      : 'Error al cargar el curso'
    : '';

  return (
    <ProtectedRoute requiredPermisos={['clubs:ver']}>
      <DashboardLayout>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : !club ? (
          <Alert variant="error">Curso de club no encontrado</Alert>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => router.push('/dashboard/clubs')}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-indigo-600" />
                    {club.nombre}
                  </h1>
                  {club.codigo && (
                    <p className="text-gray-600 mt-1">Código: {club.codigo}</p>
                  )}
                </div>
              </div>
              {puedeEditar && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button onClick={() => setShowAgregarModal(true)} className="justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Agregar Beneficiarios
                  </Button>
                </div>
              )}
            </div>

            {queryError && <Alert variant="error">{queryError}</Alert>}

            {/* Info del curso — 3 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ClubInfo club={club} />
              <ClubStats club={club} />

              {/* Asistencia de Hoy */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                  Asistencia de Hoy
                </h2>

                {todayAsistencia ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-900">Presentes</span>
                      <span className="text-2xl font-bold text-green-600">
                        {todayAsistencia.estadisticas.presentes}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-red-900">Ausentes</span>
                      <span className="text-2xl font-bold text-red-600">
                        {todayAsistencia.estadisticas.ausentes}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">Sin Registrar</span>
                      <span className="text-2xl font-bold text-gray-600">
                        {todayAsistencia.estadisticas.sinRegistrar}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      {hayEncuentroHoy ? 'Ve a Pasar Asistencia para registrar el encuentro de hoy' : 'No hay un encuentro programado para hoy'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex gap-4 sm:gap-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('beneficiarios')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'beneficiarios'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Beneficiarios ({club.beneficiarios?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('asistencia')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'asistencia'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4 inline mr-2" />
                  Pasar Asistencia
                </button>
                <button
                  onClick={() => setActiveTab('encuentros')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'encuentros' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Encuentros
                </button>
              </nav>
            </div>

            {/* Tab content */}
            {activeTab === 'beneficiarios' && (
              <ClubBeneficiarios
                club={club}
                puedeEditar={puedeEditar}
                onAgregarClick={() => setShowAgregarModal(true)}
              />
            )}

            {activeTab === 'asistencia' && (
              <ClubAsistencias
                clubId={clubId}
                club={club}
                fechasConAsistencia={fechasConAsistencia}
                mes={mesEncuentros}
                onCambiarMes={setMesEncuentros}
                onConfigurarEncuentros={() => setActiveTab('encuentros')}
                puedeEditar={puedeEditar}
              />
            )}

            {activeTab === 'encuentros' && (
              <ClubEncuentros clubId={clubId} mes={mesEncuentros}
                onCambiarMes={setMesEncuentros} puedeEditar={puedeEditar} />
            )}

            {/* Modal Agregar Beneficiarios */}
            <AgregarBeneficiariosClubModal
              isOpen={showAgregarModal}
              onClose={() => setShowAgregarModal(false)}
              onAgregar={handleAgregarBeneficiarios}
              beneficiariosActuales={club?.beneficiarios?.map((b) => b.id) || []}
            />
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
