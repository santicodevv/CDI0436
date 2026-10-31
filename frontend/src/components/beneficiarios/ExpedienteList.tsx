'use client';

import { useState, type ReactNode } from 'react';
import Button from '@/components/ui/Button';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Images,
  X,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  FileArchive,
  Calendar,
  FilePlus,
  Download,
  Eye,
} from 'lucide-react';
import type { ExpedienteEntry, TipoMetaEntry } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { dot: string; badge: string; text: string }> = {
  azul:     { dot: 'bg-blue-500',   badge: 'bg-blue-50 border-blue-200',     text: 'text-blue-700' },
  verde:    { dot: 'bg-green-500',  badge: 'bg-green-50 border-green-200',   text: 'text-green-700' },
  rojo:     { dot: 'bg-red-500',    badge: 'bg-red-50 border-red-200',       text: 'text-red-700' },
  amarillo: { dot: 'bg-yellow-400', badge: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
  morado:   { dot: 'bg-purple-500', badge: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  gris:     { dot: 'bg-gray-400',   badge: 'bg-gray-50 border-gray-200',     text: 'text-gray-600' },
};

const TIPO_META: Record<string, TipoMetaEntry> = {
  educativo:  { label: 'Educativo',   icon: GraduationCap, iconColor: 'text-blue-600' },
  registro:   { label: 'Registro',    icon: FileText,      iconColor: 'text-emerald-600' },
  documentos: { label: 'Documentos',  icon: FileArchive,   iconColor: 'text-purple-600' },
  otros:      { label: 'Otros',       icon: FileText,      iconColor: 'text-gray-500' },
  galeria:    { label: 'Galería',     icon: Images,        iconColor: 'text-indigo-600' },
  libre:      { label: 'Libre',       icon: FileText,      iconColor: 'text-gray-500' },
};

const FILTROS: { key: string; label: string }[] = [
  { key: 'educativo',  label: 'Educativo' },
  { key: 'registro',   label: 'Registro' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'otros',      label: 'Otros' },
];

// ── PdfViewerModal ────────────────────────────────────────────────────────────

function PdfViewerModal({ pdfs, onClose }: { pdfs: { nombre: string; base64_pdf: string }[]; onClose: () => void }) {
  const [selected, setSelected] = useState(0);
  if (!pdfs || pdfs.length === 0) return null;

  const handleDownload = (pdf: { nombre: string; base64_pdf: string }) => {
    const link = document.createElement('a');
    link.href = pdf.base64_pdf;
    link.download = pdf.nombre;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <FilePlus className="w-5 h-5 text-red-500" />
            <h2 className="font-bold text-gray-900">PDFs adjuntos ({pdfs.length})</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-56 border-r border-gray-100 overflow-y-auto flex-shrink-0">
            {pdfs.map((pdf, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`w-full text-left px-4 py-3 flex items-center gap-2 transition-colors text-sm ${selected === i ? 'bg-red-50 text-red-700 font-semibold border-r-2 border-red-500' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                <FilePlus className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{pdf.nombre}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-sm text-gray-600 font-medium truncate max-w-xs">{pdfs[selected].nombre}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(pdfs[selected])}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </button>
                <a
                  href={pdfs[selected].base64_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Abrir en pestaña
                </a>
              </div>
            </div>
            <iframe
              src={pdfs[selected].base64_pdf}
              className="flex-1 w-full"
              title={pdfs[selected].nombre}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── GaleriaViewModal ──────────────────────────────────────────────────────────

function GaleriaViewModal({ entrada, onClose }: { entrada: ExpedienteEntry; onClose: () => void }) {
  const [imgIndex, setImgIndex] = useState(0);
  const imagenes = entrada?.imagenes_galeria ?? [];
  if (!entrada) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            {entrada.titulo && <h2 className="text-lg font-bold text-gray-900">{entrada.titulo}</h2>}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 font-medium">{imagenes.length} {imagenes.length === 1 ? 'imagen' : 'imágenes'}</span>
              {entrada.fecha_evento && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(entrada.fecha_evento).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {imagenes.length > 0 && (
          <div className="relative bg-gray-900 flex-1 min-h-0 overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagenes[imgIndex].base64} alt="" className="max-h-[420px] w-full object-contain" />
            {imagenes.length > 1 && (
              <>
                <button onClick={() => setImgIndex(i => (i === 0 ? imagenes.length - 1 : i - 1))} className="absolute left-3 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setImgIndex(i => (i === imagenes.length - 1 ? 0 : i + 1))} className="absolute right-3 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                  {imgIndex + 1} / {imagenes.length}
                </div>
              </>
            )}
          </div>
        )}

        {imagenes.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto border-t border-gray-100 bg-gray-50">
            {imagenes.map((img, i) => (
              <button key={i} onClick={() => setImgIndex(i)} className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${imgIndex === i ? 'border-blue-500 scale-105' : 'border-gray-200 hover:border-gray-300'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.base64} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {entrada.contenido && (
          <div className="p-5 border-t border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed">{entrada.contenido}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── EntradaCard ───────────────────────────────────────────────────────────────

function EntradaCard({ entrada, onDelete, onEdit }: { entrada: ExpedienteEntry; onDelete: () => void; onEdit: () => void }) {
  const [showGaleria, setShowGaleria] = useState(false);
  const [showPdfs, setShowPdfs] = useState(false);
  const colors = COLOR_MAP[entrada.etiqueta_color || 'gris'];
  const meta = TIPO_META[entrada.tipo] || TIPO_META['otros'];
  const TipoIcon = meta.icon;
  const imagenes = entrada.imagenes_galeria ?? (entrada.imagen_base64 ? [{ base64: entrada.imagen_base64 }] : []);
  const pdfs = entrada.pdfs ?? [];
  const hasImages = imagenes.length > 0;
  const hasPdfs = pdfs.length > 0;
  const isClickable = hasImages;

  return (
    <>
      <div
        className="break-inside-avoid bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group relative mb-5"
        onClick={isClickable ? () => setShowGaleria(true) : undefined}
        style={isClickable ? { cursor: 'pointer' } : undefined}
      >
        <div className={`h-1 w-full ${colors.dot}`} />

        {hasImages && (
          <div className="relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagenes[0].base64} alt="" className="w-full object-cover max-h-56 transition-transform duration-500 group-hover:scale-105" />
            {imagenes.length > 1 && (
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm font-medium">
                {imagenes.length} fotos
              </div>
            )}
            {hasPdfs && (
              <div className="absolute top-2 right-2 bg-red-500/90 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <FilePlus className="w-3 h-3" />
                {pdfs.length} PDF{pdfs.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${colors.badge} ${colors.text}`}>
              <TipoIcon className="w-3 h-3" />
              {meta.label}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(entrada.creado_en).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {entrada.fecha_evento && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Evento:{' '}
                {new Date(entrada.fecha_evento).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}

          {entrada.titulo && (
            <h4 className="font-bold text-gray-900 text-base mb-2 leading-tight">{entrada.titulo}</h4>
          )}

          {entrada.contenido && (
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{entrada.contenido}</p>
          )}

          {imagenes.length > 1 && (
            <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
              {imagenes.slice(1, 5).map((img, i: number) => (
                <div key={i} className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.base64} alt="" className="w-full h-full object-cover" />
                  {i === 3 && imagenes.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                      +{imagenes.length - 5}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {hasPdfs && !hasImages && (
            <div className="mt-3 flex items-center gap-1.5">
              <FilePlus className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs text-red-600 font-medium">{pdfs.length} PDF{pdfs.length > 1 ? 's' : ''} adjuntos</span>
            </div>
          )}
        </div>

        <div
          className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={e => e.stopPropagation()}
        >
          {hasPdfs && (
            <button
              onClick={() => setShowPdfs(true)}
              className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
              title="Ver PDFs"
            >
              <FilePlus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showGaleria && <GaleriaViewModal entrada={{ ...entrada, imagenes_galeria: imagenes }} onClose={() => setShowGaleria(false)} />}
      {showPdfs && <PdfViewerModal pdfs={pdfs} onClose={() => setShowPdfs(false)} />}
    </>
  );
}

// ── ExpedienteList ────────────────────────────────────────────────────────────

// Pestañas que muestran información de otros módulos (solicitudes, desembolsos)
export interface SeccionExtra {
  key: string;
  label: string;
  count: number;
  content: ReactNode;
}

interface ExpedienteListProps {
  expedientes: ExpedienteEntry[];
  seccionesExtra?: SeccionExtra[];
  onAdd: () => void;
  onEdit: (entrada: ExpedienteEntry) => void;
  onDelete: (id: string) => void;
  beneficiarioNombre: string;
}

export default function ExpedienteList({ expedientes, seccionesExtra = [], onAdd, onEdit, onDelete, beneficiarioNombre }: ExpedienteListProps) {
  const [filtroActivo, setFiltroActivo] = useState('educativo');

  // Normalize legacy tipos
  const expedientesNormalizados = expedientes.map(e => ({
    ...e,
    tipo: ['galeria', 'libre'].includes(e.tipo) ? 'otros' : e.tipo,
  }));

  const conteosPorTipo = FILTROS.reduce((acc, f) => {
    acc[f.key] = expedientesNormalizados.filter(e => e.tipo === f.key).length;
    return acc;
  }, {} as Record<string, number>);

  for (const seccion of seccionesExtra) conteosPorTipo[seccion.key] = seccion.count;

  const expedientesFiltrados = expedientesNormalizados.filter(e => e.tipo === filtroActivo);
  const seccionActiva = seccionesExtra.find(seccion => seccion.key === filtroActivo);
  const filtros = [...FILTROS, ...seccionesExtra.map(({ key, label }) => ({ key, label }))];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expediente Digital</h2>
          <p className="text-sm text-gray-500 mt-0.5">Registros y documentación de {beneficiarioNombre}</p>
        </div>
        {!seccionActiva && (
          <Button
            onClick={onAdd}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm"
          >
            <Plus className="w-4 h-4" /> Nueva entrada
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filtros.map(f => {
          const count = conteosPorTipo[f.key] ?? 0;
          const isActive = filtroActivo === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFiltroActivo(f.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {seccionActiva ? (
        seccionActiva.content
      ) : expedientesFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin entradas en esta categoría</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Agrega una nueva entrada del tipo <strong>{FILTROS.find(f => f.key === filtroActivo)?.label}</strong>.
          </p>
          <Button onClick={onAdd} className="bg-blue-600 text-white">
            Agregar primera entrada
          </Button>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
          {expedientesFiltrados.map(entrada => (
            <EntradaCard
              key={entrada.id}
              entrada={entrada}
              onDelete={() => onDelete(entrada.id)}
              onEdit={() => onEdit(entrada)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
