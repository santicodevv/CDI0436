'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NuevoTicketModal from '@/components/tickets/NuevoTicketModal';
import { EstadoBadge, PRIORIDADES, TIPOS, abrirDocumentoTicket, formatFechaHora } from '@/components/tickets/ticketUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useMisTickets } from '@/lib/hooks';
import { FileText, LifeBuoy, MessageSquare, Plus, Settings } from 'lucide-react';

export default function MisTicketsPage() {
  const { tienePermiso } = useAuth();
  const [showNuevo, setShowNuevo] = useState(false);
  const { data: tickets = [], isLoading } = useMisTickets();
  const puedeCrear = tienePermiso('tickets:crear');

  return (
    <ProtectedRoute requiredPermisos={['tickets:crear', 'tickets:gestionar']}>
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <LifeBuoy className="w-7 h-7 text-blue-600" />
                Mis Tickets
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Pide cambios o reporta problemas de la plataforma. Aquí ves en qué estado está cada solicitud.
              </p>
            </div>
            <div className="flex gap-2">
              {tienePermiso('tickets:gestionar') && (
                <Link
                  href="/dashboard/tickets/gestion"
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Gestionar
                </Link>
              )}
              {puedeCrear && (
                <button
                  onClick={() => setShowNuevo(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo ticket
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <LifeBuoy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Aún no has enviado tickets</h3>
              {puedeCrear && (
                <p className="text-gray-600 mt-1 text-sm">Usa &quot;Nuevo ticket&quot; para pedir un cambio o reportar un problema.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="bg-white rounded-lg shadow p-4 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-mono">#{t.numero}</p>
                      <h3 className="font-semibold text-gray-900">{t.titulo}</h3>
                    </div>
                    <EstadoBadge estado={t.estado} />
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{t.descripcion}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>{TIPOS[t.tipo]}</span>
                    <span>
                      Prioridad: <span className={PRIORIDADES[t.prioridad].clase}>{PRIORIDADES[t.prioridad].label}</span>
                    </span>
                    <span>Enviado: {formatFechaHora(t.creado_en)}</span>
                    {t.documento_nombre && (
                      <button
                        onClick={() => abrirDocumentoTicket(t.id)}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {t.documento_nombre}
                      </button>
                    )}
                  </div>
                  {t.respuesta && (
                    <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-900">
                      <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="whitespace-pre-line">{t.respuesta}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {showNuevo && <NuevoTicketModal onClose={() => setShowNuevo(false)} />}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
