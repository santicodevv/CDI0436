'use client';

import { useState } from 'react';
import { FileText, Save, Trash2, X } from 'lucide-react';
import type { EstadoTicket, PrioridadTicket, Ticket } from '@/lib/api/tickets';
import { useActualizarTicket, useEliminarTicket } from '@/lib/hooks';
import { ESTADOS, PRIORIDADES, TIPOS, abrirDocumentoTicket, formatFechaHora, mensajeErrorApi } from './ticketUtils';

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function GestionarTicketModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const [estado, setEstado] = useState<EstadoTicket>(ticket.estado);
  const [prioridad, setPrioridad] = useState<PrioridadTicket>(ticket.prioridad);
  const [respuesta, setRespuesta] = useState(ticket.respuesta ?? '');
  const [error, setError] = useState('');
  const actualizarMutation = useActualizarTicket();
  const eliminarMutation = useEliminarTicket();

  const handleGuardar = async () => {
    setError('');
    try {
      await actualizarMutation.mutateAsync({ id: ticket.id, data: { estado, prioridad, respuesta } });
      onClose();
    } catch (err) {
      setError(mensajeErrorApi(err, 'No se pudieron guardar los cambios.'));
    }
  };

  const handleEliminar = async () => {
    if (!confirm(`¿Eliminar el ticket #${ticket.numero}? También se borrará su documento.`)) return;
    try {
      await eliminarMutation.mutateAsync(ticket.id);
      onClose();
    } catch (err) {
      setError(mensajeErrorApi(err, 'No se pudo eliminar el ticket.'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 font-mono">#{ticket.numero} · {TIPOS[ticket.tipo]}</p>
            <h3 className="text-lg font-semibold text-gray-900">{ticket.titulo}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {ticket.creado_por?.nombre ?? 'Usuario eliminado'} · {formatFechaHora(ticket.creado_en)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3">{ticket.descripcion}</p>

        {ticket.documento_nombre && (
          <button
            onClick={() => abrirDocumentoTicket(ticket.id)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <FileText className="w-4 h-4 text-red-500" />
            {ticket.documento_nombre}
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoTicket)} className={inputClass}>
              {Object.entries(ESTADOS).map(([valor, { label }]) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as PrioridadTicket)}
              className={inputClass}
            >
              {Object.entries(PRIORIDADES).map(([valor, { label }]) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Respuesta para quien lo envió</label>
          <textarea
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            rows={3}
            placeholder="Ej. Ya está implementado, lo verás en Reportes."
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={handleEliminar}
            disabled={eliminarMutation.isPending}
            className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={actualizarMutation.isPending}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {actualizarMutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
