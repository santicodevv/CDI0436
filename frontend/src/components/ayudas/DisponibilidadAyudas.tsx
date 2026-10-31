'use client';

import { useState } from 'react';
import { ExternalLink, Lock, LockOpen, Power } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useDisponibilidadAyudas, useUpdateDisponibilidadAyudas } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';

const MOTIVO_MAX = 500;
const MOTIVOS_SUGERIDOS = [
  'Presupuesto de ayudas agotado por este periodo',
  'Estamos evaluando las solicitudes recibidas',
  'Cierre temporal por vacaciones',
];

interface DisponibilidadAyudasProps {
  puedeGestionar: boolean;
}

export function DisponibilidadAyudas({ puedeGestionar }: DisponibilidadAyudasProps) {
  const { data: disponibilidad, isLoading } = useDisponibilidadAyudas();
  const updateDisponibilidad = useUpdateDisponibilidadAyudas();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  if (isLoading || !disponibilidad) {
    return <div className="h-[88px] rounded-2xl bg-white border border-gray-100 shadow-sm animate-pulse" />;
  }

  const habilitada = disponibilidad.habilitada;

  const abrirModal = () => {
    setMotivo('');
    setError('');
    setModalAbierto(true);
  };

  const confirmar = () => {
    if (habilitada && !motivo.trim()) {
      setError('Escribe el motivo; las personas lo verán en la página pública.');
      return;
    }
    updateDisponibilidad.mutate(
      habilitada ? { habilitada: false, motivo: motivo.trim() } : { habilitada: true },
      {
        onSuccess: () => setModalAbierto(false),
        onError: () => setError('No se pudo actualizar. Intenta nuevamente.'),
      }
    );
  };

  return (
    <>
      <div
        className={cn(
          'rounded-2xl border p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 transition-colors',
          habilitada ? 'bg-white border-gray-100' : 'bg-amber-50/70 border-amber-200'
        )}
      >
        <div
          className={cn(
            'w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center',
            habilitada ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
          )}
        >
          {habilitada ? <LockOpen className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {habilitada && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              )}
              <span
                className={cn(
                  'relative inline-flex h-2.5 w-2.5 rounded-full',
                  habilitada ? 'bg-emerald-500' : 'bg-amber-500'
                )}
              />
            </span>
            <p className="font-semibold text-gray-900">
              {habilitada ? 'Solicitudes abiertas' : 'Solicitudes cerradas'}
            </p>
          </div>
          <p className="text-sm text-gray-600 mt-1 break-words">
            {habilitada
              ? 'El formulario público está recibiendo solicitudes de ayuda.'
              : disponibilidad.motivo}
          </p>
          {!habilitada && disponibilidad.actualizado_por && (
            <p className="text-xs text-gray-500 mt-1">Cerrado por {disponibilidad.actualizado_por}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/ayudas"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Ver página
          </a>
          {puedeGestionar && (
            <Button
              variant={habilitada ? 'danger' : 'primary'}
              size="sm"
              onClick={abrirModal}
              className={cn('gap-1.5 rounded-full px-4', !habilitada && 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500')}
            >
              <Power className="w-4 h-4" />
              {habilitada ? 'Deshabilitar' : 'Habilitar'}
            </Button>
          )}
        </div>
      </div>

      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={habilitada ? 'Cerrar solicitudes de ayuda' : 'Reabrir solicitudes de ayuda'}
        size="md"
      >
        <div className="space-y-5">
          {error && <Alert variant="error">{error}</Alert>}

          {habilitada ? (
            <>
              <p className="text-sm text-gray-600">
                Quien entre al enlace público verá un aviso con este motivo en lugar del formulario. Las
                solicitudes ya registradas no se modifican.
              </p>
              <div>
                <label htmlFor="motivo-cierre" className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del cierre
                </label>
                <textarea
                  id="motivo-cierre"
                  value={motivo}
                  onChange={(e) => { setMotivo(e.target.value); setError(''); }}
                  maxLength={MOTIVO_MAX}
                  rows={4}
                  autoFocus
                  placeholder="Ej: Las solicitudes volverán a abrir el próximo mes."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-right text-xs text-gray-400">{motivo.length}/{MOTIVO_MAX}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {MOTIVOS_SUGERIDOS.map((sugerido) => (
                  <button
                    key={sugerido}
                    type="button"
                    onClick={() => { setMotivo(sugerido); setError(''); }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {sugerido}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              El formulario público volverá a estar disponible de inmediato y el aviso de cierre se ocultará.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              variant={habilitada ? 'danger' : 'primary'}
              onClick={confirmar}
              isLoading={updateDisponibilidad.isPending}
              className={cn(!habilitada && 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500')}
            >
              {habilitada ? 'Deshabilitar solicitudes' : 'Habilitar solicitudes'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
