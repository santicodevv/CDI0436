'use client';

import Link from 'next/link';
import { HeartHandshake, LogIn, RotateCw } from 'lucide-react';

interface AyudasCerradasProps {
  motivo: string | null;
  comprobando: boolean;
  onComprobar: () => void;
}

export function AyudasCerradas({ motivo, comprobando, onComprobar }: AyudasCerradasProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f5f7] flex items-center justify-center px-4 py-16">
      {/* Fondo con brillos suaves */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-blue-300/40 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-indigo-300/40 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-amber-200/50 blur-3xl" />
      </div>

      <Link
        href="/"
        className="absolute top-6 right-6 z-10 flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white/60 backdrop-blur-xl rounded-full border border-white/70 shadow-sm hover:bg-white/90 transition-all duration-200"
      >
        <LogIn className="w-4 h-4" />
        Iniciar Sesión
      </Link>

      <main className="relative w-full max-w-lg">
        <div className="rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)] px-6 py-10 sm:px-10 sm:py-12 text-center">
          <div className="mx-auto mb-7 h-20 w-20 rounded-[1.6rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <HeartHandshake className="h-10 w-10 text-white" strokeWidth={1.75} />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Solicitudes de ayuda
          </p>
          <h1 className="mt-3 text-3xl sm:text-[2.1rem] font-semibold tracking-tight text-gray-900 leading-tight">
            Cerradas por el momento
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
            En este momento no estamos recibiendo nuevas solicitudes.
          </p>

          {motivo && (
            <div className="mt-8 rounded-2xl bg-gray-900/[0.04] px-5 py-4 text-left">
              <p className="text-xs font-medium text-gray-500">Motivo</p>
              <p className="mt-1 text-[15px] leading-relaxed text-gray-800 whitespace-pre-line break-words">
                {motivo}
              </p>
            </div>
          )}

          <p className="mt-8 text-sm text-gray-500">
            Gracias por tu paciencia. Vuelve a visitar esta página más adelante.
          </p>

          <button
            type="button"
            onClick={onComprobar}
            disabled={comprobando}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <RotateCw className={`w-4 h-4 ${comprobando ? 'animate-spin' : ''}`} />
            Comprobar de nuevo
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          CDI - Centro de Desarrollo Integral
        </p>
      </main>
    </div>
  );
}
