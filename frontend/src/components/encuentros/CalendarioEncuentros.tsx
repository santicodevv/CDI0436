'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { format, getDaysInMonth, getDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, LockKeyhole, Save } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { EncuentrosResponse } from '@/lib/types';
import MesEncuentrosSelector from './MesEncuentrosSelector';

interface Props {
  recursoId: string;
  consulta: UseQueryResult<EncuentrosResponse, Error>;
  mutation: UseMutationResult<
    EncuentrosResponse,
    Error,
    { id: string; mes: string; fechas: string[] },
    unknown
  >;
  mes: string;
  onCambiarMes: (mes: string) => void;
  puedeEditar: boolean;
}

export default function CalendarioEncuentros({
  recursoId,
  consulta,
  mutation,
  mes,
  onCambiarMes,
  puedeEditar,
}: Props) {
  const { data, isPending, isError, refetch } = consulta;
  const [borrador, setBorrador] = useState<string[] | null>(null);
  const fechas = borrador ?? data?.fechas ?? [];
  const bloqueadas = data?.fechasBloqueadas ?? [];
  const inicioMes = parseISO(`${mes}-01`);
  const dias = Array.from(
    { length: getDaysInMonth(inicioMes) },
    (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`
  );
  const offset = (getDay(inicioMes) + 6) % 7;
  const cambiarMes = (nuevoMes: string) => {
    setBorrador(null);
    mutation.reset();
    onCambiarMes(nuevoMes);
  };

  const guardar = async () => {
    try {
      await mutation.mutateAsync({ id: recursoId, mes, fechas });
      setBorrador(null);
    } catch {
      // La alerta muestra el error y conserva la selección para reintentar.
    }
  };
  const error = isAxiosError<{ message?: string }>(mutation.error)
    ? mutation.error.response?.data.message
    : null;

  return (
    <section className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-600" /> Encuentros del mes
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          Selecciona los días en que se reunirá el grupo. Puedes programar uno,
          dos o más encuentros en cada mes. Solo estas fechas estarán
          disponibles para pasar asistencia.
        </p>
      </div>
      <MesEncuentrosSelector
        mes={mes}
        onChange={cambiarMes}
        disabled={mutation.isPending}
      />
      {isPending ? (
        <p className="text-gray-500 py-8 text-center">Cargando encuentros…</p>
      ) : isError ? (
        <Alert variant="error">
          No se pudieron cargar los encuentros.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Reintentar
          </button>
        </Alert>
      ) : (
        <>
          <div className="max-w-xl">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500 mb-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                <span key={dia}>{dia}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: offset }, (_, i) => (
                <span key={`espacio-${i}`} />
              ))}
              {dias.map((fecha, i) => {
                const seleccionado = fechas.includes(fecha);
                const bloqueado = bloqueadas.includes(fecha);
                return (
                  <button
                    type="button"
                    key={fecha}
                    aria-pressed={seleccionado}
                    aria-label={`${format(parseISO(fecha), "EEEE d 'de' MMMM", { locale: es })}${bloqueado ? ', con asistencia o fotos' : ''}`}
                    disabled={!puedeEditar || mutation.isPending || bloqueado}
                    onClick={() => {
                      mutation.reset();
                      setBorrador(
                        seleccionado
                          ? fechas.filter((f) => f !== fecha)
                          : [...fechas, fecha].sort()
                      );
                    }}
                    className={`relative aspect-square rounded-lg border-2 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${seleccionado ? 'bg-orange-600 border-orange-600 text-white' : 'border-gray-200 text-gray-700 hover:border-orange-400 hover:bg-orange-50'} disabled:cursor-default`}
                  >
                    {i + 1}
                    {bloqueado && (
                      <LockKeyhole className="absolute bottom-1 right-1 w-3 h-3" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {fechas.length} encuentro{fechas.length !== 1 ? 's' : ''}{' '}
            seleccionado{fechas.length !== 1 ? 's' : ''}.
          </p>
          {bloqueadas.length > 0 && (
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <LockKeyhole className="w-4 h-4" /> Los días con asistencia o
              fotos se conservan y no se pueden quitar.
            </p>
          )}
          {mutation.isError && (
            <Alert variant="error">
              {error ||
                'No se pudieron guardar los encuentros. Inténtalo nuevamente.'}
            </Alert>
          )}
          {mutation.isSuccess && borrador === null && (
            <Alert variant="success">Encuentros guardados.</Alert>
          )}
          {puedeEditar && (
            <Button
              onClick={guardar}
              isLoading={mutation.isPending}
              disabled={borrador === null}
            >
              <Save className="w-4 h-4 mr-2" /> Guardar encuentros
            </Button>
          )}
        </>
      )}
    </section>
  );
}
