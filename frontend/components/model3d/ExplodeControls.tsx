"use client";

import { useState, useCallback } from "react";

export interface ExplodeControlsProps {
  onShellToggle?: (open: boolean) => void;
  onExplodeChange?: (value: number) => void;
  onAutoRotateToggle?: (on: boolean) => void;
  onResetView?: () => void;
  onPlaySequence?: () => void;
}

/**
 * Barra de controles del visor 3D: abrir carcasa, slider de explosión,
 * auto-rotar, reiniciar vista y secuencia de apertura.
 */
export function ExplodeControls({
  onShellToggle,
  onExplodeChange,
  onAutoRotateToggle,
  onResetView,
  onPlaySequence,
}: ExplodeControlsProps) {
  const [shellOpen, setShellOpen] = useState(false);
  const [explode, setExplode] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);

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

  const handleAutoRotate = useCallback(() => {
    const next = !autoRotate;
    setAutoRotate(next);
    onAutoRotateToggle?.(next);
  }, [autoRotate, onAutoRotateToggle]);

  const handleReset = useCallback(() => {
    setShellOpen(false);
    setExplode(0);
    setAutoRotate(false);
    onResetView?.();
  }, [onResetView]);

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
        <label htmlFor="explodeRange">Explosión</label>
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
