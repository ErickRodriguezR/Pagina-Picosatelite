"use client";

import dynamic from "next/dynamic";
import type { RecoveryMapProps } from "./RecoveryMap";

/**
 * Wrapper cliente que carga RecoveryMap con ssr:false.
 * Leaflet accede a `window` y `document`, no funciona en SSR.
 */
const RecoveryMapDynamic = dynamic(
  () => import("./RecoveryMap").then((m) => m.RecoveryMap),
  {
    ssr: false,
    loading: () => (
      <div className="panel panel--flush">
        <div
          id="map"
          style={{ display: "grid", placeContent: "center", minHeight: "clamp(380px, 58vh, 620px)" }}
        >
          <div className="spinner" aria-hidden="true" />
          <p className="mono muted" style={{ margin: "var(--space-2) 0 0", fontSize: "0.78rem" }}>
            Cargando mapa…
          </p>
        </div>
      </div>
    ),
  }
);

export function RecoveryMapLoader(props: RecoveryMapProps) {
  return <RecoveryMapDynamic {...props} />;
}
