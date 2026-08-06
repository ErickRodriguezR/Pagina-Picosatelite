"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { ComponentTooltip } from "./ComponentTooltip";
import type { TooltipData } from "./ComponentTooltip";

export interface LayerSpec {
  id: string;
  nombre: string;
  modelo: string;
  categoria: string;
  color: string;
  specs?: Record<string, string>;
}

export interface SatelliteModelProps {
  layers: LayerSpec[];
  /** ID del componente seleccionado externamente (desde la lista). */
  selectedId?: string | null;
  /** Callback cuando el usuario hace hover sobre un componente. */
  onHover?: (id: string | null) => void;
  /** Callback cuando el usuario selecciona un componente. */
  onSelect?: (id: string | null) => void;
}

/**
 * Contenedor del canvas 3D del modelo del pico satélite.
 * Actualmente muestra un placeholder con loading state.
 * Cuando se integre @react-three/fiber, este componente montará
 * el Canvas R3F con las primitivas de geometría placeholder.
 *
 * Se importa con next/dynamic + ssr:false desde la página.
 */
export function SatelliteModel({ layers, selectedId, onHover, onSelect }: SatelliteModelProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const tooltipData = useMemo<TooltipData | null>(() => {
    const layer = selectedId ? layers.find((item) => item.id === selectedId) : undefined;
    if (!layer) return null;

    return {
      nombre: layer.nombre,
      modelo: layer.modelo,
      specs: layer.specs ?? {},
    };
  }, [selectedId, layers]);

  // Simular que el motor 3D "cargó" después de un breve momento.
  // Se reemplazará por la inicialización real del canvas R3F.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Placeholder: mostrar tooltip al hacer hover sobre la lista de hotspots
  const handlePointerMove = (e: React.PointerEvent) => {
    if (loading) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handlePointerLeave = () => {
    setTooltipPos(null);
    onHover?.(null);
  };

  const handleStageClick = () => {
    onSelect?.(selectedId ?? null);
  };

  return (
    <div
      className="stage"
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleStageClick}
    >
      {/* HUD superior */}
      <div className="stage__hud" aria-hidden="true">
        <span>PS-01 · vista de ensamble</span>
        <span>esc. 1:1</span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="stage__loading">
          <div className="spinner" aria-hidden="true" />
          <p className="mono muted" style={{ margin: 0, fontSize: "0.8rem" }}>
            Cargando motor 3D…
          </p>
        </div>
      )}

      {/* Placeholder visual mientras no hay R3F */}
      {!loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeContent: "center",
            placeItems: "center",
            gap: "var(--space-3)",
            textAlign: "center",
            padding: "var(--space-5)",
          }}
        >
          <CapsuleIcon />
          <p className="mono muted" style={{ margin: 0, fontSize: "0.78rem", maxWidth: "36ch" }}>
            Canvas R3F se monta aquí cuando se instale @react-three/fiber.
            La interacción (hover, tooltip, explosión) ya está cableada.
          </p>
        </div>
      )}

      {/* Tooltip flotante */}
      <ComponentTooltip data={tooltipData} position={tooltipPos} />
    </div>
  );
}

/** Ícono placeholder de la cápsula (se sustituirá por el canvas 3D real). */
function CapsuleIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      style={{ opacity: 0.4 }}
    >
      <rect x="18" y="12" width="28" height="40" rx="14" stroke="#2A3B57" strokeWidth="2" />
      <circle cx="32" cy="32" r="6" stroke="#FFB020" strokeWidth="1.5" />
      <path d="M32 8v4M32 52v4" stroke="#2A3B57" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 24h28M18 40h28" stroke="#2A3B57" strokeWidth="1" strokeDasharray="3 2" />
    </svg>
  );
}
