'use client';

import { Banknote } from 'lucide-react';
import { useDesembolsosBeneficiario } from '@/lib/hooks';
import { fechaDdMmAaaa } from '@/lib/utils/formatters';
import { formatMontoRD } from '@/lib/utils/desembolsos';

interface DesembolsosBeneficiarioProps {
  beneficiarioId: string;
}

export default function DesembolsosBeneficiario({ beneficiarioId }: DesembolsosBeneficiarioProps) {
  const { data: desembolsos = [], isLoading } = useDesembolsosBeneficiario(beneficiarioId);
  const total = desembolsos.reduce((sum, d) => sum + Number(d.monto), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-emerald-600" />
          Desembolsos
        </h2>
        {desembolsos.length > 0 && (
          <span className="text-sm text-gray-600">
            {desembolsos.length} {desembolsos.length === 1 ? 'registro' : 'registros'} ·{' '}
            <span className="font-semibold text-emerald-700">{formatMontoRD(total)}</span>
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : desembolsos.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">Este beneficiario no tiene desembolsos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {desembolsos.map((d) => (
                <tr key={d.id}>
                  <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">{fechaDdMmAaaa(d.fecha)}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{d.detalle}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{d.referencia || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-600">{d.cuenta || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-900 text-right whitespace-nowrap">{formatMontoRD(d.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
