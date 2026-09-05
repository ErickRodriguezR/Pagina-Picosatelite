"use client";

/**
 * AltitudeChart.tsx
 *
 * Gráfica dinámica obligatoria TR-02: Altitud (m) vs Tiempo (s).
 * Usa Plotly.js cargado dinámicamente para no bloquear SSR.
 *
 * - Se actualiza en tiempo real con cada nuevo paquete de telemetría.
 * - El eje X muestra segundos transcurridos desde el primer paquete.
 * - El eje Y muestra la altitud relativa en metros.
 * - Color de la curva cambia por fase de vuelo (WAIT/DESC/LAND).
 */

import { useEffect, useRef } from "react";
import type { TelemetryReading } from "@/lib/api/types";

export interface AltitudeChartProps {
  readings: TelemetryReading[];
}

// Mapa de color por state TR-02
const STATE_COLOR: Record<string, string> = {
  WAIT: "#f59e0b", // ámbar — espera/ascenso
  DESC: "#3b82f6", // azul  — descenso
  LAND: "#22c55e", // verde — aterrizado
};

export function AltitudeChart({ readings }: AltitudeChartProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!divRef.current || readings.length === 0) return;

    const el = divRef.current;

    // Tiempo base = timestamp del primer paquete
    const t0 = Date.parse(readings[0].timestamp);

    // Ejes
    const xSeconds = readings.map((r) =>
      parseFloat(((Date.parse(r.timestamp) - t0) / 1000).toFixed(1))
    );
    const yAltitude = readings.map((r) => r.altitud_m);

    // Segmentos coloreados por state
    // Construimos un scatter por cada cambio de estado para colorear la curva
    const segments: { x: number[]; y: number[]; state: string }[] = [];
    let current = readings[0].state;
    let seg: { x: number[]; y: number[]; state: string } = {
      x: [xSeconds[0]],
      y: [yAltitude[0]],
      state: current,
    };

    for (let i = 1; i < readings.length; i++) {
      if (readings[i].state !== current) {
        // Cierra el segmento actual con el primer punto del nuevo (para continuidad)
        seg.x.push(xSeconds[i]);
        seg.y.push(yAltitude[i]);
        segments.push(seg);
        current = readings[i].state;
        seg = { x: [xSeconds[i]], y: [yAltitude[i]], state: current };
      } else {
        seg.x.push(xSeconds[i]);
        seg.y.push(yAltitude[i]);
      }
    }
    segments.push(seg);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traces: any[] = segments.map((s, idx) => ({
      x: s.x,
      y: s.y,
      type: "scatter",
      mode: "lines+markers",
      name: s.state,
      showlegend: idx === 0 || segments[idx - 1]?.state !== s.state,
      line: {
        color: STATE_COLOR[s.state] ?? "#94a3b8",
        width: 2.5,
        shape: "spline",
      },
      marker: {
        color: STATE_COLOR[s.state] ?? "#94a3b8",
        size: 5,
      },
      hovertemplate:
        "<b>t = %{x} s</b><br>Alt = %{y:.1f} m<extra></extra>",
    }));

    const layout = {
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { color: "#94a3b8", size: 11, family: "inherit" },
      margin: { t: 8, r: 12, b: 44, l: 56 },
      xaxis: {
        title: { text: "Tiempo (s)", standoff: 8 },
        gridcolor: "#1e293b",
        zerolinecolor: "#334155",
        tickfont: { size: 10 },
      },
      yaxis: {
        title: { text: "Altitud (m)", standoff: 8 },
        gridcolor: "#1e293b",
        zerolinecolor: "#334155",
        tickfont: { size: 10 },
      },
      legend: {
        orientation: "h",
        x: 0,
        y: 1.08,
        font: { size: 10 },
        bgcolor: "transparent",
      },
      hovermode: "x unified",
    } as object;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: Record<string, any> = {
      displayModeBar: true,
      modeBarButtonsToRemove: ["toImage", "sendDataToCloud"],
      scrollZoom: true,
      responsive: true,
      displaylogo: false,
    };

    // Carga Plotly dinámicamente (sólo en cliente)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("plotly.js-dist-min").then((Plotly: any) => {
      if (!el) return;
      if (!initializedRef.current) {
        Plotly.newPlot(el, traces, layout, config);
        initializedRef.current = true;
      } else {
        Plotly.react(el, traces, layout, config);
      }
    });

    return () => {
      // Limpieza al desmontar
      if (initializedRef.current && el) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        import("plotly.js-dist-min").then((Plotly: any) => {
          Plotly.purge(el);
          initializedRef.current = false;
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readings]);

  return (
    <div
      className="panel chart-card chart-card--wide"
      style={{ minHeight: 0 }}
      aria-label="Gráfica de Altitud vs Tiempo"
    >
      <div className="chart-card__head">
        <h3>Altitud vs. Tiempo</h3>
        <span className="chart-card__hint">BMP280 · TR-02 obligatorio · zoom con scroll · arrastra para pan</span>
      </div>
      <div
        ref={divRef}
        style={{ width: "100%", height: 360 }}
        aria-label="Curva de altitud en metros versus tiempo en segundos"
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
