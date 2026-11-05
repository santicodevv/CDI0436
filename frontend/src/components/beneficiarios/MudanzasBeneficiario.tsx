'use client';

import { useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Truck } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import {
  useFinalizarMudanza,
  useMudanzas,
  useRegistrarMudanza,
} from '@/lib/hooks/useBeneficiarios';
import type {
  Beneficiario,
  CierreMudanza,
  MudanzaBeneficiario,
} from '@/lib/types';

const resultados = {
  traslado: 'Traslado',
  salida: 'Salida del programa',
};

const formatoFecha = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'medium',
});

export default function MudanzasBeneficiario({
  beneficiario,
  puedeEditar,
}: {
  beneficiario: Beneficiario;
  puedeEditar: boolean;
}) {
  const { data: mudanzas, isPending, isError } = useMudanzas(beneficiario.id);
  const registrar = useRegistrarMudanza(beneficiario.id);
  const finalizar = useFinalizarMudanza(beneficiario.id);
  const [modal, setModal] = useState<'registro' | MudanzaBeneficiario | null>(
    null,
  );
  const [resultado, setResultado] = useState('');

  const mutacion = modal === 'registro' ? registrar : finalizar;
  const error = mutacion.error;
  const respuesta = isAxiosError<{
    message?: string;
    errors?: { messages: string[] }[];
  }>(error)
    ? error.response?.data
    : undefined;
  const mensajeError =
    respuesta?.errors?.[0]?.messages[0] ||
    respuesta?.message ||
    'No se pudo guardar la mudanza.';

  const abrir = (accion: 'registro' | MudanzaBeneficiario) => {
    registrar.reset();
    finalizar.reset();
    setResultado('');
    setModal(accion);
  };

  const guardar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const campos = new FormData(event.currentTarget);
    const texto = (campo: string) => String(campos.get(campo) ?? '').trim();
    const onSuccess = () => setModal(null);

    if (modal === 'registro') {
      registrar.mutate(
        {
          direccion: texto('direccion'),
          telefono: texto('telefono'),
          cuidador: texto('cuidador'),
        },
        { onSuccess },
      );
    } else if (modal && (resultado === 'traslado' || resultado === 'salida')) {
      const data: CierreMudanza =
        resultado === 'traslado'
          ? {
              resultado,
              centro_receptor: texto('centro_receptor'),
              recepcion_confirmada: campos.has('recepcion_confirmada'),
            }
          : { resultado };
      finalizar.mutate({ mudanzaId: modal.id, data }, { onSuccess });
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Truck aria-hidden="true" className="h-5 w-5 text-blue-600" />{' '}
          Mudanzas y traslados
        </h2>
        {puedeEditar &&
          beneficiario.activo &&
          mudanzas &&
          !isError &&
          !mudanzas.some((mudanza) => !mudanza.resultado) && (
            <Button onClick={() => abrir('registro')}>Registrar mudanza</Button>
          )}
      </div>

      {isPending && (
        <p className="text-sm text-gray-500">Cargando historial…</p>
      )}
      {isError && (
        <Alert variant="error">
          No se pudo cargar el historial de mudanzas.
        </Alert>
      )}
      {mudanzas?.length === 0 && (
        <p className="text-sm text-gray-500">
          Todavía no hay mudanzas registradas.
        </p>
      )}
      {mudanzas?.map((mudanza) => (
        <article
          key={mudanza.id}
          className="space-y-2 rounded-lg border border-gray-200 p-4 text-sm text-gray-700"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900">
              {mudanza.resultado
                ? resultados[mudanza.resultado]
                : 'Pendiente de resolución'}
            </h3>
            {puedeEditar && !mudanza.resultado && (
              <Button variant="outline" onClick={() => abrir(mudanza)}>
                Finalizar caso
              </Button>
            )}
          </div>
          <p className="break-words">{mudanza.direccion}</p>
          <p>
            Cuidador {mudanza.cuidador} · Tel. {mudanza.telefono}
          </p>
          {mudanza.centro_receptor && (
            <p>Centro receptor · {mudanza.centro_receptor}</p>
          )}
          {mudanza.resultado === 'salida' && <p>Motivo de salida · Mudanza</p>}
          <p className="text-gray-500">
            Registrado por {mudanza.registrado_por} ·{' '}
            {formatoFecha.format(new Date(mudanza.registrado_en))}
          </p>
          {mudanza.finalizado_en && (
            <p className="text-gray-500">
              Finalizado por {mudanza.finalizado_por} ·{' '}
              {formatoFecha.format(new Date(mudanza.finalizado_en))}
            </p>
          )}
        </article>
      ))}

      {modal && (
        <Modal
          isOpen
          title={
            modal === 'registro' ? 'Registrar mudanza' : 'Finalizar mudanza'
          }
          onClose={() => {
            if (!mutacion.isPending) setModal(null);
          }}
        >
          <form onSubmit={guardar} className="space-y-4">
            <p className="rounded-lg bg-gray-50 p-3 text-sm font-medium text-gray-800">
              {beneficiario.codigo} ·{' '}
              {[beneficiario.nombre, beneficiario.apellido]
                .filter(Boolean)
                .join(' ')}
            </p>
            {modal === 'registro' ? (
              <>
                <p className="text-sm text-gray-600">
                  Dirección registrada ·{' '}
                  {beneficiario.direccion || 'Sin dirección registrada'}
                </p>
                <Input
                  name="direccion"
                  label="Nueva dirección"
                  aria-label="Nueva dirección"
                  required
                  maxLength={500}
                />
                <Input
                  name="telefono"
                  label="Teléfono de contacto"
                  aria-label="Teléfono de contacto"
                  type="tel"
                  required
                  maxLength={20}
                  defaultValue={beneficiario.telefono ?? ''}
                />
                <Input
                  name="cuidador"
                  label="Nombre del cuidador"
                  aria-label="Nombre del cuidador"
                  required
                  maxLength={100}
                  defaultValue={beneficiario.padre_tutor ?? ''}
                />
              </>
            ) : (
              <>
                <Select
                  label="Resultado"
                  aria-label="Resultado"
                  required
                  value={resultado}
                  onChange={(event) => setResultado(event.target.value)}
                  options={[
                    { value: 'traslado', label: resultados.traslado },
                    { value: 'salida', label: resultados.salida },
                  ]}
                />
                {resultado === 'traslado' && (
                  <>
                    <Input
                      name="centro_receptor"
                      label="Centro receptor"
                      aria-label="Centro receptor"
                      required
                      maxLength={150}
                    />
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name="recepcion_confirmada"
                        required
                        className="mt-1"
                      />
                      Confirmo que el centro receptor recibió al participante.
                    </label>
                  </>
                )}
                <Alert variant="warning">
                  Al confirmar, el participante quedará inactivo en este CDI y
                  saldrá de las listas de actividades. Su historial seguirá
                  disponible.
                </Alert>
              </>
            )}
            {error && <Alert variant="error">{mensajeError}</Alert>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModal(null)}
                disabled={mutacion.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={mutacion.isPending}>
                {modal === 'registro'
                  ? 'Guardar como pendiente'
                  : 'Confirmar cierre'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
