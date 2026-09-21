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
  /** Etiquetas de las vistas del ensamble controladas por el slider. */
  viewLabels?: readonly string[];
  viewIndex?: number;
  onViewChange?: (index: number) => void;
  /** Callback cuando cambia la explosión individual de una capa */
  onExplodePerLayerChange?: (perLayer: Record<string, number>) => void;
  onAutoRotateToggle?: (on: boolean) => void;
  onResetView?: () => void;
}

/**
 * Barra de controles del visor 3D: selector de vista, sliders individuales,
 * auto-rotar y reiniciar vista.
 */
export function ExplodeControls({
  layers = [],
  viewLabels = ["Carcasa y paracaídas", "Componentes y PCBs", "Protección del huevo", "Todo junto"],
  viewIndex = 0,
  onViewChange,
  onExplodePerLayerChange,
  onAutoRotateToggle,
  onResetView,
}: ExplodeControlsProps) {
  const [autoRotate, setAutoRotate] = useState(false);
  const [perLayer, setPerLayer] = useState<Record<string, number>>({});
  const [showIndividual, setShowIndividual] = useState(false);

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
    setAutoRotate(false);
    setPerLayer({});
    onExplodePerLayerChange?.({});
    onResetView?.();
  }, [onResetView, onExplodePerLayerChange]);

  return (
    <div className="stage-controls">
      <div className="view-control">
        <div className="view-control__head">
          <label htmlFor="modelViewRange">Vista del ensamble</label>
          <output id="modelViewValue" htmlFor="modelViewRange">
            {viewLabels[viewIndex] ?? viewLabels[0]}
          </output>
        </div>
        <input
          type="range"
          id="modelViewRange"
          min="0"
          max={Math.max(viewLabels.length - 1, 0)}
          step="1"
          value={Math.min(Math.max(viewIndex, 0), Math.max(viewLabels.length - 1, 0))}
          onChange={(event) => onViewChange?.(Number(event.target.value))}
          list="modelViewSteps"
          aria-valuetext={`${viewLabels[viewIndex] ?? viewLabels[0]} (${viewIndex + 1} de ${viewLabels.length})`}
        />
        <datalist id="modelViewSteps">
          {viewLabels.map((label, index) => (
            <option key={label} value={index} label={label} />
          ))}
        </datalist>
        <div className="view-control__labels" aria-hidden="true">
          {viewLabels.map((label, index) => (
            <span key={label} className={index === viewIndex ? "is-active" : undefined}>
              {index + 1}. {label}
            </span>
          ))}
        </div>
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
      <span className="mono muted" style={{ fontSize: "0.7rem", marginLeft: "auto" }}>
        Teclado: Tab por la lista de componentes
      </span>
    </div>
  );
}
