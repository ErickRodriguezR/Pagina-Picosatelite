"use client";

export interface TelemetryChartProps {
  /** ID del contenedor del plot (para Plotly.react). */
  id: string;
  /** Título visible de la gráfica. */
  title: string;
  /** Texto secundario (sensor/unidad). */
  hint?: string;
  /** Si la gráfica ocupa el ancho completo del grid. */
  wide?: boolean;
  /** Si usa la altura mayor (420px). */
  tall?: boolean;
}

/**
 * Tarjeta contenedora para una gráfica de Plotly.
 * Renderiza el panel con encabezado y un div vacío donde Plotly
 * montará la gráfica cuando se inicialice desde el cliente.
 * Plotly se cargará dinámicamente al abrir la vista de telemetría.
 */
export function TelemetryChart({ id, title, hint, wide = false, tall = false }: TelemetryChartProps) {
  return (
    <div className={`panel chart-card${wide ? " chart-card--wide" : ""}`}>
      <div className="chart-card__head">
        <h3>{title}</h3>
        {hint && <span className="chart-card__hint">{hint}</span>}
      </div>
      <div className={`plot${tall ? " plot--tall" : ""}`} id={id} />
    </div>
  );
}
