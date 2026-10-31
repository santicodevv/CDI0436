'use client';

import { Check } from 'lucide-react';
import { fechaDdMmAaaa } from '@/lib/utils/formatters';
import { diaSemana, type FilaFechaReporte } from '@/lib/utils/reportesExport';

interface ListaFechasReporteProps {
  titulo: string;
  periodo: string;
  datos: [string, string][];
  columnaActividad: string;
  columnaMarca: string;
  conTipo?: boolean;
  filas: FilaFechaReporte[];
  totales: [string, number][];
  vacio: string;
}

// Vista web de los PDFs por beneficiario y por tutor: Fecha | Día | [Tipo] | actividad | marca.
export default function ListaFechasReporte({ titulo, periodo, datos, columnaActividad, columnaMarca, conTipo, filas, totales, vacio }: ListaFechasReporteProps) {
  return (
    <div className="p-6 space-y-4">
      <div className="text-sm text-gray-700 space-y-1">
        <p className="font-bold text-gray-900">{periodo}</p>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-8">
          {datos.map(([etiqueta, valor]) => (
            <p key={etiqueta}><span className="font-semibold">{etiqueta}</span> {valor}</p>
          ))}
        </div>
      </div>

      <h3 className="text-center font-bold text-gray-900">{titulo}</h3>

      {filas.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-8">{vacio}</p>
      ) : (
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                {['Fecha', 'Día', ...(conTipo ? ['Tipo'] : []), columnaActividad, columnaMarca].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold border-b border-r border-gray-300 last:border-r-0 last:text-center">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={`${f.fecha}-${f.tipo}-${f.actividad}`} className="hover:bg-blue-50/50">
                  <td className="px-3 py-1.5 font-mono text-xs border-b border-r border-gray-200">{fechaDdMmAaaa(f.fecha)}</td>
                  <td className="px-3 py-1.5 border-b border-r border-gray-200">{diaSemana(f.fecha)}</td>
                  {conTipo && <td className="px-3 py-1.5 border-b border-r border-gray-200">{f.tipo}</td>}
                  <td className="px-3 py-1.5 text-gray-900 border-b border-r border-gray-200">{f.actividad}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-center">
                    {f.marcada ? (
                      <Check className="w-4 h-4 mx-auto text-green-700" aria-label={columnaMarca} />
                    ) : (
                      f.nota && <span className="text-xs font-semibold text-amber-700">{f.nota}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-8 text-sm text-gray-700">
        {totales.map(([etiqueta, valor]) => (
          <p key={etiqueta}><span className="font-semibold">{etiqueta}:</span> {valor}</p>
        ))}
      </div>
    </div>
  );
}
