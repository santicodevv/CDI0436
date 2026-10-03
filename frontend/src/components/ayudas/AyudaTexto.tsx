'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface AyudaTextoProps {
  texto: string;
  titulo: string;
  className?: string;
}

export function AyudaTexto({ texto, titulo, className = '' }: AyudaTextoProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const show = useCallback(() => {
    cancelClose();
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(384, window.innerWidth - 24);
    const maxHeight = Math.min(320, window.innerHeight - 24);
    setPosition({
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - maxHeight - 12)),
      width,
      maxHeight,
    });
  }, [cancelClose]);

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setPosition(null), 150);
  };

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && tooltipRef.current?.contains(event.target)) return;
      // Focusing a clipped cell can scroll its row; keep the tapped text open.
      if (document.activeElement === triggerRef.current) show();
      else close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [position, show]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`block max-w-full truncate text-left cursor-help focus-visible:outline-2 focus-visible:outline-blue-500 ${className}`}
        aria-label={`${titulo}: ${texto}`}
        aria-describedby={position ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={scheduleClose}
        onFocus={show}
        onBlur={scheduleClose}
        onClick={show}
      >
        {texto}
      </button>
      {position && createPortal(
        <div
          ref={tooltipRef}
          id={id}
          role="tooltip"
          tabIndex={0}
          className="fixed z-[60] overflow-y-auto rounded-lg bg-gray-900 p-4 text-sm text-white shadow-xl"
          style={position}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          onFocus={cancelClose}
          onBlur={scheduleClose}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <p className="mb-1 font-medium">{titulo}:</p>
          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{texto}</p>
        </div>,
        document.body,
      )}
    </>
  );
}
