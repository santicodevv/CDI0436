'use client';

import { BookOpen, Users, Globe, UserCheck, UserX } from 'lucide-react';
import type { TipoReportePrincipal } from '@/lib/types';

interface TabSelectorProps {
  activeTab: TipoReportePrincipal;
  onSelect: (tab: TipoReportePrincipal) => void;
}

interface TabConfig {
  key: TipoReportePrincipal;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'red';
}

const tabs: TabConfig[] = [
  { key: 'clase', icon: BookOpen, label: 'Por Clase', desc: 'Asistencias de una clase en específico', color: 'blue' },
  { key: 'beneficiario', icon: Users, label: 'Por Beneficiario', desc: 'Historial completo de un estudiante', color: 'blue' },
  { key: 'tutor', icon: UserCheck, label: 'Por Tutor', desc: 'Control de pase de lista', color: 'blue' },
  { key: 'listasPendientes', icon: UserX, label: 'Listas pendientes', desc: 'Días en que un tutor no pasó lista', color: 'red' },
  { key: 'global', icon: Globe, label: 'Estadísticas Globales', desc: 'Resumen general de todas las clases', color: 'blue' },
  { key: 'ausencias', icon: UserX, label: 'Ausencias', desc: 'Listado general de faltas', color: 'red' },
];

export default function TabSelector({ activeTab, onSelect }: TabSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {tabs.map(({ key, label, desc, icon: Icon, color }) => {
        const isActive = activeTab === key;
        const isBlue = color === 'blue';

        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-3 ${
              isActive
                ? isBlue
                  ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                  : 'border-red-500 bg-red-50 shadow-md scale-[1.02]'
                : 'border-gray-100 hover:border-blue-200 bg-white'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isActive
                  ? isBlue
                    ? 'bg-blue-600 text-white'
                    : 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{label}</h3>
              <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
