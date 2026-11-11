'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Alert from '@/components/ui/Alert';
import { useListadoMudanzas } from '@/lib/hooks';
import type { EstadoMudanza, FiltrosMudanzas, MudanzaListado } from '@/lib/types';
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderOpen,
  LogOut,
  Search,
  Truck,
  X,
} from 'lucide-react';

const ESTADOS: Record<EstadoMudanza, { label: string; badge: string }> = {
  pendiente: { label: 'Pendiente', badge: 'bg-amber-100 text-amber-800' },
  traslado: { label: 'Traslado', badge: 'bg-blue-100 text-blue-800' },
  salida: { label: 'Salida del programa', badge: 'bg-gray-200 text-gray-800' },
};
const TAMANOS = [10, 20, 50];
const LIMITE_DEFECTO = 20;

const formatoFecha = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' });
const fecha = (valor: string) => formatoFecha.format(new Date(valor));
const estadoDe = (m: MudanzaListado): EstadoMudanza => m.resultado ?? 'pendiente';

// Los filtros viven en la URL para conservarlos al volver de la carpeta.
function leerFiltros(params: URLSearchParams): FiltrosMudanzas {
  const estado = params.get('estado');
  const limite = Number(params.get('limite'));
  return {
    estado: estado && estado in ESTADOS ? (estado as EstadoMudanza) : undefined,
    buscar: params.get('buscar') || undefined,
    desde: params.get('desde') || undefined,
    hasta: params.get('hasta') || undefined,
    pagina: Math.max(1, Number(params.get('pagina')) || 1),
    limite: TAMANOS.includes(limite) ? limite : LIMITE_DEFECTO,
  };
}

function MudanzasContenido() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filtros = leerFiltros(searchParams);
  const [busqueda, setBusqueda] = useState(filtros.buscar ?? '');

  const { data, isPending, isError, isFetching } = useListadoMudanzas(filtros);

  // Lee la URL vigente (no la del render) para que la búsqueda con espera no
  // reponga filtros que el usuario ya cambió o limpió.
  const actuales = () => leerFiltros(new URLSearchParams(window.location.search));

  const actualizar = (cambios: Partial<FiltrosMudanzas>) => {
    const siguiente = { ...actuales(), pagina: 1, ...cambios };
    const params = new URLSearchParams();
    if (siguiente.estado) params.set('estado', siguiente.estado);
    if (siguiente.buscar) params.set('buscar', siguiente.buscar);
    if (siguiente.desde) params.set('desde', siguiente.desde);
    if (siguiente.hasta) params.set('hasta', siguiente.hasta);
    if (siguiente.pagina > 1) params.set('pagina', String(siguiente.pagina));
    if (siguiente.limite !== LIMITE_DEFECTO) params.set('limite', String(siguiente.limite));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // Búsqueda con espera para no consultar en cada tecla.
  useEffect(() => {
    const texto = busqueda.trim();
    const espera = setTimeout(() => {
      if (texto !== (actuales().buscar ?? '')) actualizar({ buscar: texto || undefined });
    }, 350);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  // Si la página quedó fuera de rango (p. ej. tras filtrar), volver a la última.
  useEffect(() => {
    if (data && filtros.pagina > data.totalPaginas) actualizar({ pagina: data.totalPaginas });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.totalPaginas, filtros.pagina]);

  const resumen = data?.resumen;
  const totalGeneral = resumen ? resumen.pendientes + resumen.traslados + resumen.salidas : 0;
  const hayFiltros = Boolean(filtros.estado || filtros.buscar || filtros.desde || filtros.hasta);

  const tarjetas: {
    estado?: EstadoMudanza;
    titulo: string;
    valor: number;
    icono: typeof Truck;
    color: string;
  }[] = [
    { titulo: 'Todas', valor: totalGeneral, icono: Truck, color: 'text-gray-900' },
    { estado: 'pendiente', titulo: 'Pendientes', valor: resumen?.pendientes ?? 0, icono: Clock, color: 'text-amber-600' },
    { estado: 'traslado', titulo: 'Traslados', valor: resumen?.traslados ?? 0, icono: ArrowRightLeft, color: 'text-blue-600' },
    { estado: 'salida', titulo: 'Salidas', valor: resumen?.salidas ?? 0, icono: LogOut, color: 'text-gray-600' },
  ];

  const desdeFila = data && data.total > 0 ? (data.pagina - 1) * data.limite + 1 : 0;
  const hastaFila = data ? Math.min(data.pagina * data.limite, data.total) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-7 h-7 text-blue-600" aria-hidden="true" />
          Mudanzas y traslados
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Todas las mudanzas registradas en las carpetas de los beneficiarios. Para registrar o finalizar un caso, abre la carpeta del beneficiario.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map(({ estado, titulo, valor, icono: Icono, color }) => {
          const activa = filtros.estado === estado;
          return (
            <button
              key={titulo}
              type="button"
              onClick={() => actualizar({ estado })}
              aria-pressed={activa}
              className={`text-left bg-white rounded-lg shadow p-4 border-2 transition-colors ${
                activa ? 'border-blue-500' : 'border-transparent hover:border-gray-200'
              }`}
            >
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                <Icono className={`w-4 h-4 ${color}`} aria-hidden="true" />
                {titulo}
              </p>
              <p className={`text-2xl font-bold ${color}`}>{resumen ? valor : '–'}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-end">
          <div className="relative">
            <label htmlFor="buscar" className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
            <Search className="w-4 h-4 absolute left-3 bottom-2.5 text-gray-400" aria-hidden="true" />
            <input
              id="buscar"
              type="search"
              placeholder="Código, nombre, cuidador, dirección, teléfono o centro…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="estado" className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
            <select
              id="estado"
              value={filtros.estado ?? ''}
              onChange={(e) => actualizar({ estado: (e.target.value || undefined) as EstadoMudanza | undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {(Object.keys(ESTADOS) as EstadoMudanza[]).map((estado) => (
                <option key={estado} value={estado}>{ESTADOS[estado].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="desde" className="block text-xs font-medium text-gray-600 mb-1">Registrada desde</label>
            <input
              id="desde"
              type="date"
              value={filtros.desde ?? ''}
              max={filtros.hasta}
              onChange={(e) => actualizar({ desde: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label htmlFor="hasta" className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
            <input
              id="hasta"
              type="date"
              value={filtros.hasta ?? ''}
              min={filtros.desde}
              onChange={(e) => actualizar({ hasta: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button
            type="button"
            disabled={!hayFiltros}
            onClick={() => {
              setBusqueda('');
              actualizar({ estado: undefined, buscar: undefined, desde: undefined, hasta: undefined });
            }}
            className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Limpiar
          </button>
        </div>
      </div>

      {isError ? (
        <Alert variant="error">No se pudo cargar el listado de mudanzas.</Alert>
      ) : isPending ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : data.total === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-gray-900">
            {hayFiltros ? 'Ninguna mudanza coincide con los filtros' : 'Todavía no hay mudanzas registradas'}
          </h3>
        </div>
      ) : (
        <div className={`bg-white rounded-lg shadow overflow-hidden transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Estado', 'Beneficiario', 'Nueva dirección', 'Contacto', 'Centro receptor', 'Registrada', 'Finalizada', ''].map((titulo) => (
                    <th key={titulo} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      {titulo || <span className="sr-only">Acciones</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((m) => {
                  const estado = ESTADOS[estadoDe(m)];
                  const nombre = [m.beneficiario.nombre, m.beneficiario.apellido].filter(Boolean).join(' ');
                  return (
                    <tr key={m.id} className="align-top hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${estado.badge}`}>
                          {estado.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium text-gray-900">{nombre}</p>
                        <p className="font-mono text-xs text-gray-500">
                          {m.beneficiario.codigo}
                          {!m.beneficiario.activo && ' · Inactivo'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs break-words">{m.direccion}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        <p>{m.cuidador}</p>
                        <p className="text-xs text-gray-500">Tel. {m.telefono}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{m.centro_receptor || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        <p>{fecha(m.registrado_en)}</p>
                        <p className="text-xs text-gray-500">{m.registrado_por}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {m.finalizado_en ? (
                          <>
                            <p>{fecha(m.finalizado_en)}</p>
                            <p className="text-xs text-gray-500">{m.finalizado_por}</p>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/beneficiarios/${m.beneficiario.id}`}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
                        >
                          <FolderOpen className="w-4 h-4" aria-hidden="true" />
                          {m.resultado ? 'Ver carpeta' : 'Finalizar en carpeta'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>
                Mostrando {desdeFila} a {hastaFila} de {data.total}
              </span>
              <label className="flex items-center gap-1">
                <span className="sr-only sm:not-sr-only">Por página</span>
                <select
                  value={filtros.limite}
                  onChange={(e) => actualizar({ limite: Number(e.target.value) })}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                >
                  {TAMANOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Página anterior"
                onClick={() => actualizar({ pagina: data.pagina - 1 })}
                disabled={data.pagina <= 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700 px-2">
                Página {data.pagina} de {data.totalPaginas}
              </span>
              <button
                type="button"
                aria-label="Página siguiente"
                onClick={() => actualizar({ pagina: data.pagina + 1 })}
                disabled={data.pagina >= data.totalPaginas}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MudanzasPage() {
  return (
    <ProtectedRoute requiredPermisos={['mudanzas:ver']}>
      <DashboardLayout>
        <Suspense fallback={null}>
          <MudanzasContenido />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
