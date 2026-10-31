'use client';

import { useState } from 'react';
import { Printer, X } from 'lucide-react';
import type { BonoRegalo } from '@/lib/api/bonos';
import { useActualizarBono } from '@/lib/hooks';
import { calcularFechaExpiracion, imprimirBonos } from '@/lib/utils/exportBonoPDF';

interface ImprimirBonoModalProps {
  bono: BonoRegalo;
  onClose: () => void;
}

// La columna `expira` llega como 'YYYY-MM-DD'; la plantilla usa 'DD/MM/YYYY'.
function formatExpira(expira: string | null): string {
  if (!expira) return calcularFechaExpiracion();
  const [y, m, d] = expira.slice(0, 10).split('-');
  if (!y || !m || !d) return expira;
  return `${d}/${m}/${y}`;
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500';

export default function ImprimirBonoModal({ bono, onClose }: ImprimirBonoModalProps) {
  const [inicial] = useState(() => ({
    mes: bono.mes,
    padre: bono.padre_nombre ?? '',
    cedula: bono.cedula ?? '',
    beneficiario: bono.beneficiario_nombre,
    codigo: bono.codigo,
    monto: String(bono.monto),
    expira: formatExpira(bono.expira),
  }));
  const [form, setForm] = useState(inicial);
  const [error, setError] = useState('');
  const actualizarMutation = useActualizarBono();

  const setCampo = (campo: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const montoValido = form.monto.trim() !== '' && !isNaN(Number(form.monto)) && Number(form.monto) >= 0;
  const expiraValida = form.expira.trim() === '' || /^\d{2}\/\d{2}\/\d{4}$/.test(form.expira.trim());
  const hayCambios = (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k] !== inicial[k]);

  const handleImprimir = async () => {
    setError('');
    if (hayCambios) {
      try {
        await actualizarMutation.mutateAsync({
          id: bono.id,
          data: {
            beneficiario_nombre: form.beneficiario,
            padre_nombre: form.padre,
            cedula: form.cedula,
            codigo: form.codigo,
            monto: Number(form.monto),
            mes: form.mes,
            expira: form.expira.trim(),
          },
        });
      } catch {
        setError('No se pudieron guardar los cambios. Revisa los datos e intenta de nuevo.');
        return;
      }
    }

    const { mes, expira, ...row } = form;
    if (!imprimirBonos([row], mes, expira)) {
      setError('Los cambios se guardaron, pero el navegador bloqueó la ventana de impresión. Permite ventanas emergentes y vuelve a imprimir.');
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Imprimir Bono</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Corrige cualquier dato antes de imprimir. Los cambios se guardan en la lista de regalos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiario</label>
            <input value={form.beneficiario} onChange={setCampo('beneficiario')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Padre / Tutor</label>
            <input value={form.padre} onChange={setCampo('padre')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
            <input value={form.cedula} onChange={setCampo('cedula')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input value={form.codigo} onChange={setCampo('codigo')} className={`${inputClass} font-mono`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.monto}
              onChange={setCampo('monto')}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
            <input value={form.mes} onChange={setCampo('mes')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expira</label>
            <input
              value={form.expira}
              onChange={setCampo('expira')}
              placeholder="DD/MM/AAAA"
              className={inputClass}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleImprimir}
            disabled={
              actualizarMutation.isPending ||
              !form.beneficiario.trim() ||
              !form.codigo.trim() ||
              !form.mes.trim() ||
              !montoValido ||
              !expiraValida
            }
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            {actualizarMutation.isPending ? 'Guardando...' : hayCambios ? 'Guardar e imprimir' : 'Imprimir'}
          </button>
        </div>
      </div>
    </div>
  );
}
