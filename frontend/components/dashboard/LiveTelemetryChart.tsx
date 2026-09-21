"use client";

/**
 * LiveTelemetryChart.tsx
 *
 * Componente genérico de gráfica en tiempo real.
 * Recibe el array `readings` del hook useLiveTelemetry y una función
 * `buildTraces` que transforma esos datos en trazas de Plotly.
 *
 * Cada vez que llega un paquete nuevo por SSE, readings cambia →
 * useEffect se dispara → Plotly.react() actualiza la gráfica sin redibujar.
 */

import { useEffect, useRef } from "react";
import type { TelemetryReading } from "@/lib/api/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PlotlyTrace = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PlotlyLayout = Record<string, any>;

export interface LiveTelemetryChartProps {
  /** Título visible encima de la gráfica. */
  title: string;
  /** Texto secundario (sensor / unidad). */
  hint?: string;
  /** Ocupa el ancho completo del grid. */
  wide?: boolean;
  /** Usa altura mayor (420 px). */
  tall?: boolean;
  /** Array de lecturas en tiempo real proveniente de useLiveTelemetry. */
  readings: TelemetryReading[];
  /**
   * Función que transforma readings en trazas de Plotly.
   * Se recalcula cada vez que readings cambia.
   */
  buildTraces: (readings: TelemetryReading[]) => PlotlyTrace[];
  /**
   * Layout extra que se fusiona con el layout base.
   * Úsalo para sobreescribir ejes, título de ejes, etc.
   */
  layoutOverride?: PlotlyLayout;
}

/** Layout oscuro base compartido por todas las gráficas. */
const BASE_LAYOUT: PlotlyLayout = {
  paper_bgcolor: "transparent",
  plot_bgcolor:  "transparent",
  font: { color: "#94a3b8", size: 11, family: "inherit" },
  margin: { t: 8, r: 12, b: 44, l: 56 },
  xaxis: {
    title:       { text: "Tiempo (s)", standoff: 8 },
    gridcolor:   "#1e293b",
    zerolinecolor: "#334155",
    tickfont:    { size: 10 },
  },
  yaxis: {
    gridcolor:   "#1e293b",
    zerolinecolor: "#334155",
    tickfont:    { size: 10 },
  },
  legend: {
    orientation: "h",
    x: 0, y: 1.08,
    font: { size: 10 },
    bgcolor: "transparent",
  },
  hovermode: "x unified",
};

const PLOTLY_CONFIG = {
  displayModeBar: true,
  modeBarButtonsToRemove: ["toImage", "sendDataToCloud"],
  scrollZoom: true,
  responsive: true,
  displaylogo: false,
};

export function LiveTelemetryChart({
  title,
  hint,
  wide = false,
  tall = false,
  readings,
  buildTraces,
  layoutOverride = {},
}: LiveTelemetryChartProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!divRef.current || readings.length === 0) return;
    const el = divRef.current;

    const traces = buildTraces(readings);
    const layout = { ...BASE_LAYOUT, ...layoutOverride };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("plotly.js-dist-min").then((Plotly: any) => {
      if (!el) return;
      if (!initializedRef.current) {
        Plotly.newPlot(el, traces, layout, PLOTLY_CONFIG);
        initializedRef.current = true;
      } else {
        Plotly.react(el, traces, layout, PLOTLY_CONFIG);
      }
    });

    return () => {
      if (initializedRef.current && el) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        import("plotly.js-dist-min").then((Plotly: any) => {
          Plotly.purge(el);
          initializedRef.current = false;
        });
      }
    };
    // buildTraces y layoutOverride son estables (se definen fuera del render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readings]);

  return (
    <div className={`panel chart-card${wide ? " chart-card--wide" : ""}`} style={{ minHeight: 0 }}>
      <div className="chart-card__head">
        <h3>{title}</h3>
        {hint && <span className="chart-card__hint">{hint}</span>}
      </div>
      <div
        ref={divRef}
        style={{ width: "100%", height: tall ? 420 : 300 }}
        aria-label={title}
      />
      {readings.length === 0 && (
        <p
          className="muted"
          style={{ textAlign: "center", padding: "var(--space-6) 0", fontSize: "0.82rem" }}
        >
          Esperando datos de telemetría…
        </p>
      )}
    </div>
  );
}
