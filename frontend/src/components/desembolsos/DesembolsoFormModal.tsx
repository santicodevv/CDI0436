'use client';

import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { CheckCircle, Loader2, Save, X, XCircle } from 'lucide-react';
import type { Desembolso, DesembolsoPayload } from '@/lib/api/desembolsos';
import { useActualizarDesembolso, useBeneficiarioPorCodigo, useCrearDesembolso } from '@/lib/hooks';
import { hoyIso } from '@/lib/utils/desembolsos';

interface DesembolsoFormModalProps {
  desembolso?: Desembolso | null;
  onClose: () => void;
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

function mensajeError(err: unknown): string {
  if (isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (typeof message === 'string' && message !== 'Validation failed') return message;
  }
  return 'No se pudo guardar el registro. Revisa los datos e intenta de nuevo.';
}

export default function DesembolsoFormModal({ desembolso, onClose }: DesembolsoFormModalProps) {
  const editando = !!desembolso;
  const [form, setForm] = useState({
    fecha: desembolso?.fecha.slice(0, 10) ?? hoyIso(),
    detalle: desembolso?.detalle ?? '',
    codigo: desembolso?.codigo_beneficiario ?? '',
    referencia: desembolso?.referencia ?? '',
    cuenta: desembolso?.cuenta ?? '',
    monto: desembolso ? String(desembolso.monto) : '',
  });
  const [codigoBuscado, setCodigoBuscado] = useState(form.codigo.trim());
  const [error, setError] = useState('');

  // Busca el beneficiario cuando se deja de escribir el código
  useEffect(() => {
    const t = setTimeout(() => setCodigoBuscado(form.codigo.trim()), 400);
    return () => clearTimeout(t);
  }, [form.codigo]);

  const { data: beneficiario, isFetching: buscando, isError: noEncontrado } =
    useBeneficiarioPorCodigo(codigoBuscado);
  const crearMutation = useCrearDesembolso();
  const actualizarMutation = useActualizarDesembolso();
  const guardando = crearMutation.isPending || actualizarMutation.isPending;

  const setCampo =
    (campo: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [campo]: e.target.value }));

  const codigoListo = codigoBuscado === form.codigo.trim() && !!beneficiario && !buscando;
  const monto = Number(form.monto);
  const puedeGuardar =
    !guardando && !!form.fecha && !!form.detalle.trim() && codigoListo && form.monto.trim() !== '' && monto > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGuardar) return;
    setError('');
    const data: DesembolsoPayload = {
      fecha: form.fecha,
      detalle: form.detalle,
      codigo_beneficiario: form.codigo.trim(),
      referencia: form.referencia,
      cuenta: form.cuenta,
      monto: Math.round(monto * 100) / 100,
    };
    try {
      if (desembolso) {
        await actualizarMutation.mutateAsync({ id: desembolso.id, data });
      } else {
        await crearMutation.mutateAsync(data);
      }
      onClose();
    } catch (err) {
      setError(mensajeError(err));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {editando ? 'Editar desembolso' : 'Registrar desembolso'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input type="date" value={form.fecha} onChange={setCampo('fecha')} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código del beneficiario</label>
            <input
              value={form.codigo}
              onChange={setCampo('codigo')}
              placeholder="Ej. DO-0000-0000"
              className={`${inputClass} font-mono`}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiario</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm min-h-[38px]">
              {!form.codigo.trim() ? (
                <span className="text-gray-400">Se llena al escribir el código</span>
              ) : buscando || codigoBuscado !== form.codigo.trim() ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-gray-500">Buscando...</span>
                </>
              ) : beneficiario ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-gray-900">{beneficiario.nombre}</span>
                </>
              ) : noEncontrado ? (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">No existe un beneficiario con ese código</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Detalle</label>
            <textarea
              value={form.detalle}
              onChange={setCampo('detalle')}
              rows={2}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
            <input value={form.referencia} onChange={setCampo('referencia')} maxLength={100} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
            <input value={form.cuenta} onChange={setCampo('cuenta')} maxLength={100} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto (RD$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.monto}
              onChange={setCampo('monto')}
              className={inputClass}
              required
            />
          </div>
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
            disabled={!puedeGuardar}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
