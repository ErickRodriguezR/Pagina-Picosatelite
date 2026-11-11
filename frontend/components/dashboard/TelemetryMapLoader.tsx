"use client";

import dynamic from "next/dynamic";
import type { TelemetryMapProps } from "./TelemetryMap";

/**
 * Carga dinámica del mapa de telemetría con SSR desactivado.
 * Leaflet accede directamente al objeto `window` y al DOM.
 */
const TelemetryMapDynamic = dynamic(
  () => import("./TelemetryMap").then((m) => m.TelemetryMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="panel panel--corner"
        style={{
          minHeight: "420px",
          display: "grid",
          placeContent: "center",
          background: "var(--bg-panel)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="spinner" aria-hidden="true" />
          <p className="mono muted" style={{ margin: "var(--space-2) 0 0", fontSize: "0.82rem" }}>
            Inicializando mapa GPS…
          </p>
        </div>
      </div>
    ),
  }
);

export function TelemetryMapLoader(props: TelemetryMapProps) {
  return <TelemetryMapDynamic {...props} />;
}
