"use client";

import { useState, useCallback } from "react";

export interface LayerInfo {
  id: string;
  nombre: string;
  color: string;
}

export interface ExplodeControlsProps {
  /** Lista de capas disponibles para controles individuales */
  layers?: LayerInfo[];
  onShellToggle?: (open: boolean) => void;
  onExplodeChange?: (value: number) => void;
  /** Callback cuando cambia la explosión individual de una capa */
  onExplodePerLayerChange?: (perLayer: Record<string, number>) => void;
  onAutoRotateToggle?: (on: boolean) => void;
  onResetView?: () => void;
  onPlaySequence?: () => void;
}

/**
 * Barra de controles del visor 3D: abrir carcasa, slider de explosión global,
 * sliders individuales por componente, auto-rotar, reiniciar vista y secuencia.
 */
export function ExplodeControls({
  layers = [],
  onShellToggle,
  onExplodeChange,
  onExplodePerLayerChange,
  onAutoRotateToggle,
  onResetView,
  onPlaySequence,
}: ExplodeControlsProps) {
  const [shellOpen, setShellOpen] = useState(false);
  const [explode, setExplode] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [perLayer, setPerLayer] = useState<Record<string, number>>({});
  const [showIndividual, setShowIndividual] = useState(false);

  const handleShell = useCallback(() => {
    const next = !shellOpen;
    setShellOpen(next);
    onShellToggle?.(next);
  }, [shellOpen, onShellToggle]);

  const handleExplode = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setExplode(value);
      onExplodeChange?.(value / 100);
    },
    [onExplodeChange]
  );

  const handlePerLayerChange = useCallback(
    (layerId: string, value: number) => {
      setPerLayer((prev) => {
        const next = { ...prev, [layerId]: value / 100 };
        onExplodePerLayerChange?.(next);
        return next;
      });
    },
    [onExplodePerLayerChange]
  );

  const handleAutoRotate = useCallback(() => {
    const next = !autoRotate;
    setAutoRotate(next);
    onAutoRotateToggle?.(next);
  }, [autoRotate, onAutoRotateToggle]);

  const handleReset = useCallback(() => {
    setShellOpen(false);
    setExplode(0);
    setAutoRotate(false);
    setPerLayer({});
    onExplodePerLayerChange?.({});
    onResetView?.();
  }, [onResetView, onExplodePerLayerChange]);

  const handleSequence = useCallback(() => {
    setShellOpen(true);
    setExplode(100);
    onPlaySequence?.();
  }, [onPlaySequence]);

  return (
    <div className="stage-controls">
      <button
        className="btn btn--sm"
        type="button"
        aria-pressed={shellOpen}
        onClick={handleShell}
      >
        <ShellIcon />
        {shellOpen ? "Cerrar carcasa" : "Abrir carcasa"}
      </button>

      <div className="control-group">
        <label htmlFor="explodeRange">Explosión global</label>
        <input
          type="range"
          id="explodeRange"
          min="0"
          max="100"
          value={explode}
          step="1"
          onChange={handleExplode}
          aria-describedby="explodeValue"
        />
        <span
          className="mono muted"
          id="explodeValue"
          style={{ fontSize: "0.72rem", minWidth: "3ch" }}
        >
          {explode}%
        </span>
      </div>

      {layers.length > 0 && (
        <button
          className="btn btn--sm"
          type="button"
          aria-pressed={showIndividual}
          onClick={() => setShowIndividual((v) => !v)}
        >
          {showIndividual ? "Ocultar individuales" : "Explosión individual"}
        </button>
      )}

      {showIndividual && layers.length > 0 && (
        <div
          className="control-group-stack"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            width: "100%",
            padding: "0.5rem 0",
          }}
        >
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="control-group"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: layer.color,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              <label
                htmlFor={`explode-${layer.id}`}
                style={{ fontSize: "0.75rem", minWidth: "8rem" }}
              >
                {layer.nombre}
              </label>
              <input
                type="range"
                id={`explode-${layer.id}`}
                min="0"
                max="100"
                value={Math.round((perLayer[layer.id] ?? 0) * 100)}
                step="1"
                onChange={(e) => handlePerLayerChange(layer.id, Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span
                className="mono muted"
                style={{ fontSize: "0.7rem", minWidth: "3ch" }}
              >
                {Math.round((perLayer[layer.id] ?? 0) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        className="btn btn--sm"
        type="button"
        aria-pressed={autoRotate}
        onClick={handleAutoRotate}
      >
        Auto-rotar
      </button>
      <button className="btn btn--sm" type="button" onClick={handleReset}>
        Reiniciar vista
      </button>
      <button className="btn btn--sm" type="button" onClick={handleSequence}>
        Secuencia de apertura
      </button>
      <span className="mono muted" style={{ fontSize: "0.7rem", marginLeft: "auto" }}>
        Teclado: Tab por la lista de componentes
      </span>
    </div>
  );
}

function ShellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2v12M4 5 1.5 8 4 11M12 5l2.5 3-2.5 3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
