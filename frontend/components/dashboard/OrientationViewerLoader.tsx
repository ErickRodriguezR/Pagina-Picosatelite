"use client";

import dynamic from "next/dynamic";
import type { OrientationViewerProps } from "./OrientationViewer";

/**
 * Carga dinámica del visor 3D de orientación con SSR deshabilitado.
 * Three.js necesita el DOM y WebGL, así que se importa solo en el cliente.
 */
const OrientationViewerDynamic = dynamic(
  () => import("./OrientationViewer").then((m) => m.OrientationViewer),
  {
    ssr: false,
    loading: () => (
      <div className="panel panel--corner" style={{ minHeight: "360px", display: "grid", placeContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" aria-hidden="true" />
          <p className="mono muted" style={{ margin: "var(--space-2) 0 0", fontSize: "0.8rem" }}>
            Cargando visor 3D…
          </p>
        </div>
      </div>
    ),
  }
);

export function OrientationViewerLoader(props: OrientationViewerProps) {
  return <OrientationViewerDynamic {...props} />;
}
