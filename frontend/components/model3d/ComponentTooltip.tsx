"use client";

import { forwardRef } from "react";

export interface TooltipData {
  nombre: string;
  modelo: string;
  specs: Record<string, string>;
}

export interface ComponentTooltipProps {
  /** Datos del componente a mostrar. null oculta el tooltip. */
  data: TooltipData | null;
  /** Posición en píxeles relativa al contenedor del stage. */
  position: { x: number; y: number } | null;
  /** Si el tooltip debería mostrarse invertido (izquierda/arriba). */
  flipX?: boolean;
  flipY?: boolean;
}

/**
 * Tooltip flotante que aparece al hacer hover sobre un componente del modelo 3D.
 * Se posiciona absolutamente dentro del contenedor `.stage`.
 */
export const ComponentTooltip = forwardRef<HTMLDivElement, ComponentTooltipProps>(
  function ComponentTooltip({ data, position, flipX = false, flipY = false }, ref) {
    const visible = data !== null && position !== null;
    const specs = data ? Object.entries(data.specs).slice(0, 4) : [];

    const style: React.CSSProperties = position
      ? {
          left: flipX ? undefined : `${position.x + 16}px`,
          right: flipX ? `calc(100% - ${position.x - 16}px)` : undefined,
          top: flipY ? undefined : `${position.y + 16}px`,
          bottom: flipY ? `calc(100% - ${position.y - 8}px)` : undefined,
        }
      : {};

    return (
      <div
        ref={ref}
        className={`tooltip3d${visible ? " is-visible" : ""}`}
        role="presentation"
        style={style}
      >
        {data && (
          <>
            <p className="tooltip3d__name">{data.nombre}</p>
            <p className="tooltip3d__model">{data.modelo}</p>
            <dl>
              {specs.map(([key, value]) => (
                <span key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </span>
              ))}
            </dl>
          </>
        )}
      </div>
    );
  }
);
