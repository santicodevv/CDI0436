'use client';

import { addMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  mes: string;
  onChange: (mes: string) => void;
  disabled?: boolean;
}

export default function MesEncuentrosSelector({
  mes,
  onChange,
  disabled,
}: Props) {
  const fecha = parseISO(`${mes}-01`);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        aria-label="Mes anterior"
        disabled={disabled || mes === '1000-01'}
        onClick={() => onChange(format(addMonths(fecha, -1), 'yyyy-MM'))}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <label className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-700">
        <span className="capitalize">
          {format(fecha, 'MMMM yyyy', { locale: es })}
        </span>
        <input
          type="month"
          aria-label="Mes de los encuentros"
          min="1000-01"
          max="9999-12"
          value={mes}
          disabled={disabled}
          onChange={(e) => {
            if (/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(e.target.value))
              onChange(e.target.value);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
        />
      </label>
      <button
        type="button"
        aria-label="Mes siguiente"
        disabled={disabled || mes === '9999-12'}
        onClick={() => onChange(format(addMonths(fecha, 1), 'yyyy-MM'))}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
