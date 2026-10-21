'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { isAxiosError } from 'axios';
import {
  Calendar,
  Check,
  X,
  Save,
  Camera,
  Upload,
  Loader2,
  ZoomIn,
  Trash2,
  Users,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import SupervivenciaMesSelector from './SupervivenciaMesSelector';
import {
  Supervivencia,
  AsistenciaLocal,
} from '@/lib/types';
import {
  useAsistenciasSupervivencia,
  useRegistrarAsistenciaSupervivencia,
  useFotosSupervivencia,
  useSubirFotoSupervivencia,
  useEliminarFotoSupervivencia,
  useEncuentrosSupervivencia,
} from '@/lib/hooks/useSupervivencias';

interface SupervivenciaAsistenciaProps {
  supervivenciaId: string;
  supervivencia: Supervivencia;
  fechasConAsistencia: string[];
  mes: string;
  onCambiarMes: (mes: string) => void;
  onConfigurarEncuentros: () => void;
  puedeEditar: boolean;
}

export default function SupervivenciaAsistencia({
  supervivenciaId,
  supervivencia,
  fechasConAsistencia,
  mes,
  onCambiarMes,
  onConfigurarEncuentros,
  puedeEditar,
}: SupervivenciaAsistenciaProps) {
  const { data, isPending, isError, refetch } = useEncuentrosSupervivencia(supervivenciaId, mes);
  const [seleccionada, setSeleccionada] = useState('');
  const fechas = data?.fechas ?? [];
  const hoy = format(new Date(), 'yyyy-MM-dd');
  const fecha = fechas.includes(seleccionada) ? seleccionada : fechas.includes(hoy) ? hoy : fechas[0];

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Encuentros para pasar asistencia</h2>
        <SupervivenciaMesSelector mes={mes} onChange={onCambiarMes} />
        {isPending ? <p className="text-gray-500">Cargando encuentros…</p> : isError ? (
          <Alert variant="error">No se pudieron cargar los encuentros. <button type="button" className="underline" onClick={() => refetch()}>Reintentar</button></Alert>
        ) : fechas.length === 0 ? (
          <div className="space-y-3">
            <p className="text-gray-600">No hay encuentros configurados para este mes.</p>
            {puedeEditar && <Button variant="outline" onClick={onConfigurarEncuentros}>Configurar encuentros</Button>}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {fechas.map((dia) => (
              <button type="button" key={dia} aria-pressed={fecha === dia} onClick={() => setSeleccionada(dia)}
                className={`px-4 py-3 rounded-lg border-2 text-sm capitalize ${fecha === dia ? 'bg-orange-600 border-orange-600 text-white' : 'border-gray-200 text-gray-700 hover:border-orange-400'}`}>
                {format(parseISO(dia), 'EEEE d', { locale: es })}
                {fechasConAsistencia.includes(dia) && <span className="block text-xs mt-1">Asistencia registrada</span>}
              </button>
            ))}
          </div>
        )}
      </section>
      {!isPending && !isError && fecha && (
        <RegistroEncuentro key={`${supervivenciaId}-${fecha}`} supervivenciaId={supervivenciaId}
          supervivencia={supervivencia} fechasConAsistencia={fechasConAsistencia}
          fechaAsistencia={fecha} puedeEditar={puedeEditar} />
      )}
    </div>
  );
}

function RegistroEncuentro({
  supervivenciaId, supervivencia, fechasConAsistencia, fechaAsistencia, puedeEditar,
}: Pick<SupervivenciaAsistenciaProps, 'supervivenciaId' | 'supervivencia' | 'fechasConAsistencia' | 'puedeEditar'> & { fechaAsistencia: string }) {
  const [asistenciasLocales, setAsistenciasLocales] = useState<AsistenciaLocal[]>([]);
  const [lightboxFoto, setLightboxFoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attendance data query
  const {
    data: asistenciasData,
    isLoading: loadingAsistencia,
    error: errorAsistencia,
  } = useAsistenciasSupervivencia(supervivenciaId, fechaAsistencia);

  // Track which key we've initialized to avoid re-initializing on refetch
  const initializedKeyRef = useRef<string>('');

  // Initialize local attendance state when navigating to a new date
  useEffect(() => {
    if (asistenciasData) {
      const currentKey = `${supervivenciaId}-${fechaAsistencia}`;
      if (currentKey !== initializedKeyRef.current) {
        initializedKeyRef.current = currentKey;
        setAsistenciasLocales(
          asistenciasData.asistencias.map((a) => ({
            beneficiario_id: a.beneficiario.id,
            presente: a.presente ?? false,
            observaciones: a.observaciones || '',
          }))
        );
      }
    }
  }, [asistenciasData, supervivenciaId, fechaAsistencia]);

  // Photos query
  const {
    data: fotosData,
    isLoading: loadingFoto,
  } = useFotosSupervivencia(supervivenciaId, fechaAsistencia);

  const fotos = useMemo(() => {
    if (!fotosData) return [];
    return Array.isArray(fotosData) ? fotosData : [fotosData];
  }, [fotosData]);

  // Mutations
  const registrarMutation = useRegistrarAsistenciaSupervivencia();
  const subirFotoMutation = useSubirFotoSupervivencia();
  const eliminarFotoMutation = useEliminarFotoSupervivencia();

  const handleAsistenciaChange = useCallback((beneficiarioId: string, presente: boolean) => {
    setAsistenciasLocales((prev) =>
      prev.map((a) =>
        a.beneficiario_id === beneficiarioId ? { ...a, presente } : a
      )
    );
  }, []);

  const handleObservacionChange = useCallback(
    (beneficiarioId: string, observaciones: string) => {
      setAsistenciasLocales((prev) =>
        prev.map((a) =>
          a.beneficiario_id === beneficiarioId ? { ...a, observaciones } : a
        )
      );
    },
    []
  );

  const handleGuardarAsistencia = async () => {
    if (!puedeEditar || loadingAsistencia || errorAsistencia || !asistenciasData || asistenciasLocales.length !== asistenciasData.asistencias.length) return;
    try {
      await registrarMutation.mutateAsync({
        id: supervivenciaId,
        data: {
          fecha: fechaAsistencia,
          asistencias: asistenciasLocales.map((a) => ({
            beneficiario_id: a.beneficiario_id,
            presente: a.presente,
            observaciones: a.observaciones || undefined,
          })),
        },
      });
    } catch {
      // Error is surfaced via mutation state
    }
  };

  const marcarTodos = useCallback((presente: boolean) => {
    setAsistenciasLocales((prev) => prev.map((a) => ({ ...a, presente })));
  }, []);

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!puedeEditar) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((f) => {
      if (!f.type.startsWith('image/')) {
        alert(`"${f.name}" no es una imagen válida`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        alert(`"${f.name}" supera los 5MB`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;

    try {
      for (const file of validFiles) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await subirFotoMutation.mutateAsync({
          supervivenciaId,
          fecha: fechaAsistencia,
          imagenBase64: base64,
        });
      }
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al subir la foto');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEliminarFoto = async (fotoId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta foto?')) return;
    try {
      await eliminarFotoMutation.mutateAsync({ supervivenciaId, fotoId });
    } catch {
      alert('Error al eliminar la foto');
    }
  };

  const yaRegistrada = fechasConAsistencia.includes(fechaAsistencia);

  // Count present/absent from local state
  const presentes = asistenciasLocales.filter((a) => a.presente).length;
  const ausentes = asistenciasLocales.filter((a) => !a.presente).length;

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        {/* Header con fecha y acciones */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Pasar Asistencia
              </h2>
              <span className="text-sm text-gray-700 capitalize">
                {format(parseISO(fechaAsistencia), "EEEE d 'de' MMMM", { locale: es })}
              </span>
              {yaRegistrada && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Ya registrada
                </span>
              )}
            </div>
            {puedeEditar && <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => marcarTodos(true)}
                disabled={loadingAsistencia || !!errorAsistencia || !asistenciasData || registrarMutation.isPending}
                className="flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Todos Presentes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => marcarTodos(false)}
                disabled={loadingAsistencia || !!errorAsistencia || !asistenciasData || registrarMutation.isPending}
                className="flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Todos Ausentes
              </Button>
              <Button
                onClick={handleGuardarAsistencia}
                isLoading={registrarMutation.isPending}
                disabled={loadingAsistencia || !!errorAsistencia || !asistenciasData || asistenciasLocales.length === 0 || asistenciasLocales.length !== asistenciasData.asistencias.length}
                className="flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Guardar
              </Button>
            </div>}
          </div>
        </div>

        {registrarMutation.isSuccess && <Alert variant="success" className="m-4">Asistencia guardada.</Alert>}
        {registrarMutation.isError && <Alert variant="error" className="m-4">{isAxiosError<{ message?: string }>(registrarMutation.error) ? registrarMutation.error.response?.data.message || 'No se pudo guardar la asistencia.' : 'No se pudo guardar la asistencia.'}</Alert>}
        {errorAsistencia && <Alert variant="error" className="m-4">No se pudo cargar la asistencia. Inténtalo nuevamente.</Alert>}

        {/* Fotos del día — galería multi-foto */}
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Fotos del día
              {fotos.length > 0 && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                  {fotos.length}
                </span>
              )}
            </h3>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleSubirFoto}
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!puedeEditar || subirFotoMutation.isPending || loadingFoto}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {subirFotoMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Subir Foto
                </>
              )}
            </button>
          </div>

          {loadingFoto && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          )}

          {!loadingFoto && fotos.length > 0 && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {fotos.map((foto, idx: number) => (
                  <div
                    key={foto.id}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer bg-gray-50"
                    onClick={() => setLightboxFoto(foto.imagen_url)}
                  >
                    <img
                      src={foto.imagen_url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-1.5">
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/90 rounded-full shadow hover:bg-white transition-all scale-90 group-hover:scale-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxFoto(foto.imagen_url);
                        }}
                        title="Ver ampliada"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                      <button
                        disabled={!puedeEditar || eliminarFotoMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/90 rounded-full shadow hover:bg-red-600 transition-all scale-90 group-hover:scale-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarFoto(foto.id);
                        }}
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                    <div className="absolute top-1 left-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">{idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loadingFoto && fotos.length === 0 && !subirFotoMutation.isPending && (
            <div className="text-center py-5 mx-4 mb-4 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <Camera className="w-8 h-8 mx-auto mb-1 opacity-40" />
              <p className="text-xs">
                Sin fotos · haz click en &quot;Subir Foto&quot; para agregar
              </p>
            </div>
          )}
        </div>

        {/* Estadísticas rápidas */}
        {asistenciasData && (
          <div className="px-6 py-3 bg-gray-50 border-b flex items-center gap-6 text-sm">
            <span className="text-gray-600">
              Total: <strong>{asistenciasData.estadisticas.total}</strong>
            </span>
            <span className="text-green-600">
              Presentes: <strong>{presentes}</strong>
            </span>
            <span className="text-red-600">
              Ausentes: <strong>{ausentes}</strong>
            </span>
          </div>
        )}

        {/* Lista de asistencia */}
        {loadingAsistencia ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : !supervivencia.beneficiarios || supervivencia.beneficiarios.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No hay beneficiarios inscritos para pasar asistencia
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {asistenciasData?.asistencias.map((asistencia) => {
              const local = asistenciasLocales.find(
                (a) => a.beneficiario_id === asistencia.beneficiario.id
              );
              return (
                <div
                  key={asistencia.beneficiario.id}
                  className="p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-medium">
                          {asistencia.beneficiario.nombre.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {asistencia.beneficiario.nombre}{' '}
                          {asistencia.beneficiario.apellido || ''}
                        </p>
                        <p className="text-sm text-gray-500">
                          Código: {asistencia.beneficiario.codigo}
                        </p>
                      </div>
                    </div>

                    {/* Botones de asistencia */}
                    <div className="flex items-center gap-2">
                      <button
                        disabled={!puedeEditar || registrarMutation.isPending}
                        onClick={() =>
                          handleAsistenciaChange(asistencia.beneficiario.id, true)
                        }
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          local?.presente === true
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 text-gray-400 hover:border-green-500 hover:text-green-500'
                        }`}
                        title="Presente"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        disabled={!puedeEditar || registrarMutation.isPending}
                        onClick={() =>
                          handleAsistenciaChange(asistencia.beneficiario.id, false)
                        }
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          local?.presente === false
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'border-gray-300 text-gray-400 hover:border-red-500 hover:text-red-500'
                        }`}
                        title="Ausente"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Campo de observaciones */}
                    <div className="hidden sm:block w-48">
                      <input
                        type="text"
                        disabled={!puedeEditar || registrarMutation.isPending}
                        placeholder="Observaciones..."
                        value={local?.observaciones || ''}
                        onChange={(e) =>
                          handleObservacionChange(
                            asistencia.beneficiario.id,
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxFoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxFoto(null)}
        >
          <button
            onClick={() => setLightboxFoto(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={lightboxFoto}
            alt="Foto de asistencia"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
