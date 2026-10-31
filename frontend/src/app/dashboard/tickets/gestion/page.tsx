'use client';

import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import GestionarTicketModal from '@/components/tickets/GestionarTicketModal';
import { ESTADOS, EstadoBadge, PRIORIDADES, TIPOS, formatFechaHora } from '@/components/tickets/ticketUtils';
import { useTickets } from '@/lib/hooks';
import type { EstadoTicket, Ticket } from '@/lib/api/tickets';
import { ChevronLeft, ChevronRight, FileText, Inbox, Search } from 'lucide-react';

export default function GestionTicketsPage() {
  const [estado, setEstado] = useState<EstadoTicket | ''>('');
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<Ticket | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 15;

  // Los conteos por estado salen de la lista completa; el filtro se aplica en el cliente
  const { data: todos = [], isLoading } = useTickets({ buscar: busqueda || undefined });
  const tickets = useMemo(() => (estado ? todos.filter((t) => t.estado === estado) : todos), [todos, estado]);
  const conteos = useMemo(() => {
    const c: Record<string, number> = {};
    todos.forEach((t) => {
      c[t.estado] = (c[t.estado] ?? 0) + 1;
    });
    return c;
  }, [todos]);

  const totalPaginas = Math.ceil(tickets.length / itemsPorPagina);
  const paginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return tickets.slice(inicio, inicio + itemsPorPagina);
  }, [tickets, paginaActual]);

  const filtroBoton = (valor: EstadoTicket | '', label: string, cantidad: number) => (
    <button
      key={valor || 'todos'}
      onClick={() => {
        setEstado(valor);
        setPaginaActual(1);
      }}
      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
        estado === valor ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {label} <span className="opacity-70">({cantidad})</span>
    </button>
  );

  return (
    <ProtectedRoute requiredPermisos={['tickets:gestionar']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Inbox className="w-7 h-7 text-blue-600" />
              Gestión de Tickets
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Todas las solicitudes enviadas. Abre un ticket para cambiar su estado o responder.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número, título o descripción..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filtroBoton('', 'Todos', todos.length)}
              {(Object.keys(ESTADOS) as EstadoTicket[]).map((e) => filtroBoton(e, ESTADOS[e].label, conteos[e] ?? 0))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No hay tickets</h3>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enviado por</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginados.map((t) => (
                      <tr key={t.id} onClick={() => setSeleccionado(t)} className="cursor-pointer hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-500">{t.numero}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          <span className="flex items-center gap-2">
                            {t.titulo}
                            {t.documento_nombre && <FileText className="w-4 h-4 text-red-500 shrink-0" />}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{TIPOS[t.tipo]}</td>
                        <td className={`px-4 py-3 text-sm ${PRIORIDADES[t.prioridad].clase}`}>{PRIORIDADES[t.prioridad].label}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.creado_por?.nombre ?? '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatFechaHora(t.creado_en)}</td>
                        <td className="px-4 py-3"><EstadoBadge estado={t.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Mostrando {(paginaActual - 1) * itemsPorPagina + 1} a{' '}
                    {Math.min(paginaActual * itemsPorPagina, tickets.length)} de {tickets.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                      disabled={paginaActual === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-700 px-2">{paginaActual} / {totalPaginas}</span>
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

        {seleccionado && <GestionarTicketModal ticket={seleccionado} onClose={() => setSeleccionado(null)} />}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
