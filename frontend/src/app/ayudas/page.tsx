'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { ayudasApi, type DisponibilidadAyudas } from '@/lib/api/ayudas';
import { AyudasCerradas } from '@/components/ayudas/AyudasCerradas';
import { beneficiariosApi } from '@/lib/api/beneficiarios';
import { FileText, Loader2, LogIn, Search, User, Upload, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface BeneficiarioSugerido {
  id: string;
  codigo: string;
  nombre: string;
  apellido?: string;
  padre_tutor?: string;
  telefono?: string;
  profesor_nombre?: string;
}

interface FormData {
  nombre_beneficiario: string;
  codigo_beneficiario: string;
  nombre_madre: string;
  nombre_tutor: string;
  telefono: string;
  tipo: 'medica' | 'alimentos' | 'pequeno_negocio' | 'educacion' | 'otros';
  tipo_especificacion?: string;
  detalle: string;
  foto_url?: string;
}

export default function AyudasPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadAyudas | null>(null);
  const [comprobandoDisponibilidad, setComprobandoDisponibilidad] = useState(true);

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [sugerencias, setSugerencias] = useState<BeneficiarioSugerido[]>([]);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [beneficiarioSeleccionado, setBeneficiarioSeleccionado] = useState<BeneficiarioSugerido | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const sugerenciasRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>();

  const tipoSeleccionado = watch('tipo');

  // Si no se puede consultar, se muestra el formulario: el backend vuelve a validar al enviar.
  const comprobarDisponibilidad = async () => {
    setComprobandoDisponibilidad(true);
    try {
      setDisponibilidad(await ayudasApi.getDisponibilidad());
    } catch {
      setDisponibilidad(null);
    } finally {
      setComprobandoDisponibilidad(false);
    }
  };

  useEffect(() => {
    let activo = true;
    ayudasApi
      .getDisponibilidad()
      .then((data) => activo && setDisponibilidad(data))
      .catch(() => undefined)
      .finally(() => activo && setComprobandoDisponibilidad(false));
    return () => {
      activo = false;
    };
  }, []);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(e.target as Node)) {
        setShowSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const buscarBeneficiarios = async (nombre: string) => {
    if (nombre.trim().length < 2) {
      setSugerencias([]);
      setShowSugerencias(false);
      return;
    }

    try {
      setBuscando(true);
      const resultados = await beneficiariosApi.buscarPublico(nombre);
      setSugerencias(resultados);
      setShowSugerencias(resultados.length > 0);
    } catch {
      setSugerencias([]);
    } finally {
      setBuscando(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setValue('nombre_beneficiario', value);
    setBeneficiarioSeleccionado(null);

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      buscarBeneficiarios(value);
    }, 300);
  };

  const seleccionarBeneficiario = (b: BeneficiarioSugerido) => {
    const nombreCompleto = `${b.nombre} ${b.apellido || ''}`.trim();
    setSearchQuery(nombreCompleto);
    setBeneficiarioSeleccionado(b);
    setShowSugerencias(false);

    // Fill form fields
    setValue('nombre_beneficiario', nombreCompleto);
    setValue('codigo_beneficiario', b.codigo);
    if (b.padre_tutor) {
      setValue('nombre_madre', b.padre_tutor);
    }
    // Usar el profesor de clase como tutor
    if (b.profesor_nombre) {
      setValue('nombre_tutor', b.profesor_nombre);
    }
    if (b.telefono) {
      setValue('telefono', b.telefono);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamano (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no puede ser mayor a 5MB');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten imagenes');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFotoPreview(base64);
        setFotoBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFoto = () => {
    setFotoPreview(null);
    setFotoBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (!beneficiarioSeleccionado) {
        setError('Por favor, busca y selecciona un beneficiario válido de la lista.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setLoading(true);
      setError('');
      setSuccess('');

      // Incluir foto si existe y el tipo no es alimentos
      const submitData = { ...data };
      if (fotoBase64 && data.tipo !== 'alimentos') {
        submitData.foto_url = fotoBase64;
      }

      await ayudasApi.create(submitData);
      setSuccess('Solicitud registrada correctamente! Pronto recibiras una respuesta.');
      reset();
      setSearchQuery('');
      setBeneficiarioSeleccionado(null);
      setFotoPreview(null);
      setFotoBase64(null);
    } catch (err) {
      // Las solicitudes se cerraron mientras la persona llenaba el formulario.
      if ((err as { response?: { status?: number } }).response?.status === 403) {
        await comprobarDisponibilidad();
        return;
      }
      setError('Error al registrar la solicitud. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (comprobandoDisponibilidad && !disponibilidad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" aria-label="Cargando" />
      </div>
    );
  }

  if (disponibilidad && !disponibilidad.habilitada) {
    return (
      <AyudasCerradas
        motivo={disponibilidad.motivo}
        comprobando={comprobandoDisponibilidad}
        onComprobar={comprobarDisponibilidad}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Login Button */}
      <Link
        href="/"
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-blue-700 font-medium rounded-lg shadow-sm hover:bg-white hover:shadow-md transition-all duration-200 border border-blue-200"
      >
        <LogIn className="w-4 h-4" />
        Iniciar Sesión
      </Link>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Solicitud de Ayuda
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            CDI - Centro de Desarrollo Integral
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Registrar Solicitud de Ayuda
          </h2>

          {error && <Alert variant="error" className="mb-6">{error}</Alert>}
          {success && <Alert variant="success" className="mb-6">{success}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Autocomplete Beneficiario */}
              <div className="relative" ref={sugerenciasRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Beneficiario
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => sugerencias.length > 0 && setShowSugerencias(true)}
                    placeholder="Escribe para buscar beneficiario..."
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.nombre_beneficiario ? 'border-red-500' : 'border-gray-300'
                    } ${beneficiarioSeleccionado ? 'bg-green-50 border-green-300' : ''}`}
                  />
                  {buscando && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                <input type="hidden" {...register('nombre_beneficiario', { required: true })} />
                {errors.nombre_beneficiario && (
                  <p className="mt-1 text-sm text-red-600">Este campo es requerido</p>
                )}
                {beneficiarioSeleccionado && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Beneficiario seleccionado: {beneficiarioSeleccionado.codigo}
                  </p>
                )}

                {/* Dropdown sugerencias */}
                {showSugerencias && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {sugerencias.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => seleccionarBeneficiario(b)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {b.nombre} {b.apellido || ''}
                            </p>
                            {b.padre_tutor && (
                              <p className="text-xs text-gray-500">Padre/Tutor: {b.padre_tutor}</p>
                            )}
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            {b.codigo}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Input
                label="Código Beneficiario (Autocompletado)"
                type="text"
                {...register('codigo_beneficiario', { required: true })}
                error={errors.codigo_beneficiario ? 'Este campo es requerido' : ''}
                placeholder="DR0436..."
                readOnly
                className="bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nombre del Padre o Tutor"
                type="text"
                {...register('nombre_madre', { required: true })}
                error={errors.nombre_madre ? 'Este campo es requerido' : ''}
                placeholder="Nombre completo de la madre"
              />
              <Input
                label="Profesor"
                type="text"
                {...register('nombre_tutor', { required: true })}
                error={errors.nombre_tutor ? 'Este campo es requerido' : ''}
                placeholder="Profesor que le da clase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero de Telefono (WhatsApp)
              </label>
              <input
                type="tel"
                {...register('telefono', {
                  validate: (value) => {
                    if (!value) return true;
                    const soloNumeros = value.replace(/[^0-9]/g, '');
                    if (soloNumeros.length > 10) {
                      return 'Maximo 10 digitos';
                    }
                    return true;
                  }
                })}
                onKeyPress={(e) => {
                  if (!/[0-9\-]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                placeholder="Ej: 809-555-1234"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.telefono ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.telefono && (
                <p className="mt-1 text-sm text-red-600">{errors.telefono.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Ayuda
              </label>
              <select
                {...register('tipo', { required: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccione el tipo de ayuda...</option>
                <option value="alimentos">Alimentos</option>
                <option value="medica">Ayuda Medica</option>
                <option value="pequeno_negocio">Pequenos Negocios</option>
                <option value="educacion">Educacion</option>
                <option value="otros">Otros</option>
              </select>
              {errors.tipo && (
                <p className="mt-1 text-sm text-red-600">Este campo es requerido</p>
              )}
            </div>

            {tipoSeleccionado === 'otros' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <Input
                  label="Especifique el tipo de ayuda"
                  type="text"
                  {...register('tipo_especificacion', { required: tipoSeleccionado === 'otros' })}
                  error={errors.tipo_especificacion ? 'Debe especificar el tipo de ayuda' : ''}
                  placeholder="Ej: Útiles escolares, ropa, transporte..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detalle de la Solicitud
              </label>
              <textarea
                {...register('detalle', { required: true })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Describa detalladamente el motivo de la solicitud..."
              ></textarea>
              {errors.detalle && (
                <p className="mt-1 text-sm text-red-600">Este campo es requerido</p>
              )}
            </div>

            {/* Campo de foto - solo para tipos que no son alimentos */}
            {tipoSeleccionado && tipoSeleccionado !== 'alimentos' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto (Opcional)
                </label>
                <div className="mt-1">
                  {!fotoPreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Haz clic para subir una foto</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 5MB</p>
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <Image
                        src={fotoPreview}
                        alt="Preview"
                        width={400}
                        height={300}
                        className="max-h-48 w-auto h-auto rounded-lg border border-gray-200"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={removeFoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loading}
            >
              Registrar Solicitud
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-600">
          © 2024 CDI. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
