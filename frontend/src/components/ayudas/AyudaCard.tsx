'use client';

import { useRef, type PointerEvent } from 'react';
import { Phone, Image as ImageIcon, MessageSquare, CheckCircle, XCircle, Trash2, ImagePlus, Upload } from 'lucide-react';
import type { Ayuda } from '@/lib/types';
import { AyudaTexto } from './AyudaTexto';
import styles from './AyudaCard.module.css';

interface AyudaCardProps {
  ayuda: Ayuda;
  onViewFoto: (url: string) => void;
  onOpenComentarios: (ayuda: Ayuda) => void;
  onUploadFotoEntrega: (ayuda: Ayuda) => void;
  onViewFotoEntrega: (url: string) => void;
  onAprobar: (id: string) => void;
  onRechazar: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AyudaCard({
  ayuda,
  onViewFoto,
  onOpenComentarios,
  onUploadFotoEntrega,
  onViewFotoEntrega,
  onAprobar,
  onRechazar,
  onDelete,
}: AyudaCardProps) {
  const dragRef = useRef<{ pointerId: number; x: number; scrollLeft: number } | null>(null);
  const wasDragged = useRef(false);

  const startDrag = (event: PointerEvent<HTMLTableRowElement>) => {
    wasDragged.current = false;
    if (event.pointerType === 'touch' || event.button !== 0) return;
    if ((event.target as Element).closest('button, a, input, textarea, select')) return;
    const row = event.currentTarget;
    if (row.scrollWidth <= row.clientWidth) return;
    // Leave the native scrollbar available for direct interaction.
    if (event.clientY - row.getBoundingClientRect().top >= row.clientHeight) return;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, scrollLeft: row.scrollLeft };
    row.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const moveDrag = (event: PointerEvent<HTMLTableRowElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.x;
    if (!wasDragged.current && Math.abs(distance) < 5) return;
    wasDragged.current = true;
    event.currentTarget.dataset.dragging = 'true';
    event.currentTarget.scrollLeft = drag.scrollLeft - distance;
    event.preventDefault();
  };

  const endDrag = (event: PointerEvent<HTMLTableRowElement>) => {
    dragRef.current = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const tipoLabel = {
    medica: 'Médica',
    alimentos: 'Alimentos',
    pequeno_negocio: 'Peq. Negocio',
    educacion: 'Educación',
    otros: ayuda.tipo_especificacion ? `Otros: ${ayuda.tipo_especificacion}` : 'Otros',
  };

  const tipoColors: Record<string, string> = {
    medica: 'bg-red-100 text-red-800',
    alimentos: 'bg-green-100 text-green-800',
    pequeno_negocio: 'bg-purple-100 text-purple-800',
    educacion: 'bg-blue-100 text-blue-800',
  };

  const estadoBadge = {
    aprobada: 'bg-green-100 text-green-800',
    rechazada: 'bg-red-100 text-red-800',
    pendiente: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <tr
      className={`${styles.row} hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500`}
      tabIndex={0}
      aria-label={`Solicitud de ${ayuda.nombre_beneficiario}`}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onClickCapture={(event) => {
        if (wasDragged.current) {
          event.preventDefault();
          event.stopPropagation();
          wasDragged.current = false;
        }
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          event.currentTarget.scrollBy({ left: event.key === 'ArrowRight' ? 180 : -180, behavior: 'smooth' });
        }
      }}
    >
      <td data-label="Código" className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
        {ayuda.codigo_beneficiario}
      </td>
      <td data-label="Beneficiario" className="px-3 py-3 text-sm text-gray-500 [overflow-wrap:anywhere]">
        <div className="font-medium text-gray-900">{ayuda.nombre_beneficiario}</div>
        <div className="text-xs text-gray-500">Profesor: {ayuda.nombre_tutor}</div>
      </td>
      <td data-label="Teléfono" className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
        {ayuda.telefono ? (
          <a
            href={`https://wa.me/${ayuda.telefono.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-green-600 hover:text-green-800 transition"
            title="Abrir WhatsApp"
          >
            <Phone className="w-4 h-4" />
            {ayuda.telefono}
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td data-label="Tipo" className="px-3 py-3 text-sm">
        <div className="flex items-center gap-2">
          <AyudaTexto
            texto={tipoLabel[ayuda.tipo] || 'Otros'}
            titulo="Tipo de ayuda completo"
            className={`w-36 shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tipoColors[ayuda.tipo] || 'bg-gray-100 text-gray-800'}`}
          />
          {ayuda.foto_url && (
            <button
              onClick={() => onViewFoto(ayuda.foto_url!)}
              className="shrink-0 text-blue-600 hover:text-blue-800"
              title="Ver foto"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
      <td data-label="Detalle" className="px-3 py-3 text-sm text-gray-500">
        <AyudaTexto texto={ayuda.detalle} titulo="Detalle completo" className="w-44 hover:text-blue-600" />
      </td>
      <td data-label="Estado" className="px-3 py-3 whitespace-nowrap">
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoBadge[ayuda.estado]}`}>
          {ayuda.estado.charAt(0).toUpperCase() + ayuda.estado.slice(1)}
        </span>
      </td>
      <td data-label="Fecha" className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
        {new Date(ayuda.creado_en).toLocaleDateString('es-DO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
      </td>
      <td data-label="Acciones" className="px-3 py-3 whitespace-nowrap text-sm font-medium">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => onOpenComentarios(ayuda)}
            title="Ver comentarios"
            className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded-full hover:bg-blue-100 transition"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          {(ayuda.estado === 'pendiente' || ayuda.estado === 'aprobada') && (
            <>
              {ayuda.foto_entrega_url ? (
                <button
                  onClick={() => onViewFotoEntrega(ayuda.foto_entrega_url!)}
                  title="Ver foto de entrega"
                  className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 p-1.5 rounded-full hover:bg-emerald-100 transition"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => onUploadFotoEntrega(ayuda)}
                  title="Subir foto de entrega"
                  className="text-orange-600 hover:text-orange-900 bg-orange-50 p-1.5 rounded-full hover:bg-orange-100 transition"
                >
                  <Upload className="w-5 h-5" />
                </button>
              )}
            </>
          )}
          {ayuda.estado === 'pendiente' && (
            <>
              <button
                onClick={() => onAprobar(ayuda.id)}
                title="Aprobar"
                className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded-full hover:bg-green-100 transition"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => onRechazar(ayuda.id)}
                title="Rechazar"
                className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-full hover:bg-red-100 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(ayuda.id)}
            title="Eliminar"
            className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
