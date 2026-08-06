"use client";

import { useState, useCallback } from "react";

export interface Phase {
  key: string;
  label: string;
}

export interface FilterState {
  from: string;
  to: string;
  phases: Set<string>;
}

export interface SensorFilterBarProps {
  phases: Phase[];
  /** Estado inicial del filtro. */
  initialFrom?: string;
  initialTo?: string;
  /** Callback cuando cambia cualquier parámetro del filtro. */
  onChange?: (filter: FilterState) => void;
  /** Callback para reiniciar filtros. */
  onReset?: () => void;
  /** Texto de resumen (ej. "120 de 350 paquetes"). */
  summary?: string;
  /** Slot para el botón de exportar. */
  exportButton?: React.ReactNode;
}

/**
 * Barra de filtros de la vista de telemetría:
 * rango de fechas + toggles de fase de vuelo.
 */
export function SensorFilterBar({
  phases,
  initialFrom = "",
  initialTo = "",
  onChange,
  onReset,
  summary = "",
  exportButton,
}: SensorFilterBarProps) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [activePhases, setActivePhases] = useState<Set<string>>(
    () => new Set(phases.map((p) => p.key))
  );

  const emitChange = useCallback(
    (nextFrom: string, nextTo: string, nextPhases: Set<string>) => {
      onChange?.({ from: nextFrom, to: nextTo, phases: nextPhases });
    },
    [onChange]
  );

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrom(e.target.value);
    emitChange(e.target.value, to, activePhases);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTo(e.target.value);
    emitChange(from, e.target.value, activePhases);
  };

  const togglePhase = (key: string) => {
    setActivePhases((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev; // nunca dejar vacío
        next.delete(key);
      } else {
        next.add(key);
      }
      emitChange(from, to, next);
      return next;
    });
  };

  const handleReset = () => {
    setFrom(initialFrom);
    setTo(initialTo);
    setActivePhases(new Set(phases.map((p) => p.key)));
    onReset?.();
  };

  return (
    <div className="filter-bar" style={{ marginTop: "var(--space-4)" }}>
      <div className="grid grid--2" style={{ gap: "var(--space-3)" }}>
        <div className="field">
          <label htmlFor="filterFrom">Desde</label>
          <input
            type="datetime-local"
            id="filterFrom"
            step="1"
            value={from}
            onChange={handleFromChange}
          />
        </div>
        <div className="field">
          <label htmlFor="filterTo">Hasta</label>
          <input
            type="datetime-local"
            id="filterTo"
            step="1"
            value={to}
            onChange={handleToChange}
          />
        </div>
        <div className="field" style={{ gridColumn: "1/-1" }}>
          <label id="phaseFilterLabel">Fase de vuelo</label>
          <div className="chip-toggles" role="group" aria-labelledby="phaseFilterLabel">
            {phases.map((phase) => (
              <button
                key={phase.key}
                className="chip"
                type="button"
                data-phase={phase.key}
                aria-pressed={activePhases.has(phase.key)}
                onClick={() => togglePhase(phase.key)}
              >
                {phase.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="btn-row" style={{ alignItems: "center" }}>
        {summary && (
          <span className="mono muted" style={{ fontSize: "0.74rem" }}>
            {summary}
          </span>
        )}
        <button className="btn btn--sm" type="button" onClick={handleReset}>
          Restablecer
        </button>
        {exportButton}
      </div>
    </div>
  );
}
