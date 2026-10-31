'use client';

import { useRef, useState } from 'react';
import { FileText, Send, Upload, X } from 'lucide-react';
import type { PrioridadTicket, TipoTicket } from '@/lib/api/tickets';
import { useCrearTicket } from '@/lib/hooks';
import { PRIORIDADES, TIPOS, mensajeErrorApi } from './ticketUtils';

const TAMANO_MAXIMO = 10 * 1024 * 1024;
const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function NuevoTicketModal({ onClose }: { onClose: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<TipoTicket>('mejora');
  const [prioridad, setPrioridad] = useState<PrioridadTicket>('media');
  const [documento, setDocumento] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const crearMutation = useCrearTicket();

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('El documento debe ser un archivo PDF.');
      return;
    }
    if (file.size > TAMANO_MAXIMO) {
      setError('El PDF no puede pesar más de 10 MB.');
      return;
    }
    setError('');
    setDocumento(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) return;
    setError('');
    try {
      await crearMutation.mutateAsync({ titulo, descripcion, tipo, prioridad, documento });
      onClose();
    } catch (err) {
      setError(mensajeErrorApi(err, 'No se pudo enviar el ticket. Intenta de nuevo.'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Nuevo ticket</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={200}
            placeholder="Ej. Agregar exportación a Excel en Reportes"
            className={inputClass}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoTicket)} className={inputClass}>
              {Object.entries(TIPOS).map(([valor, label]) => (
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={5}
            placeholder="Explica qué necesitas, dónde pasa y cómo debería funcionar."
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Documento PDF (opcional)</label>
          <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleArchivo} className="hidden" />
          {documento ? (
            <div className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
              <span className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
                <FileText className="w-4 h-4 text-red-500 shrink-0" />
                <span className="truncate">{documento.name}</span>
              </span>
              <button type="button" onClick={() => setDocumento(null)} className="text-gray-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors text-sm text-gray-600"
            >
              <Upload className="w-4 h-4 text-gray-400" />
              Adjuntar PDF (máx. 10 MB)
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={crearMutation.isPending || !titulo.trim() || !descripcion.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {crearMutation.isPending ? 'Enviando...' : 'Enviar ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
