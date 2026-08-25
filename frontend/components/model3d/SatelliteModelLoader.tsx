"use client";

import dynamic from "next/dynamic";
import type { SatelliteModelProps } from "./SatelliteModel";

/**
 * Wrapper cliente que carga SatelliteModel con ssr:false.
 * next/dynamic con ssr:false solo funciona desde un Client Component.
 * Necesario porque R3F/Three.js requieren acceso al DOM y WebGL.
 */
const SatelliteModelDynamic = dynamic(
  () => import("./SatelliteModel").then((m) => m.SatelliteModel),
  {
    ssr: false,
    loading: () => (
      <div className="stage">
        <div className="stage__loading">
          <div className="spinner" aria-hidden="true" />
          <p className="mono muted" style={{ margin: 0, fontSize: "0.8rem" }}>
            Cargando motor 3D…
          </p>
        </div>
      </div>
    ),
  }
);

export type SatelliteModelLoaderProps = SatelliteModelProps;

export function SatelliteModelLoader(props: SatelliteModelLoaderProps) {
  return <SatelliteModelDynamic {...props} />;
}
