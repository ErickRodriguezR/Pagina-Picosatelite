"use client";

import { useState, useCallback } from "react";
import { ExplodeControls } from "@/components/model3d";
import { SatelliteModelLoader } from "@/components/model3d/SatelliteModelLoader";
import type { LayerSpec } from "@/components/model3d";

/**
 * Vista 02 — Modelo 3D interactivo
 * Usa los componentes de components/model3d/ para el visor, controles
 * y la lista de capas/tarjeta de detalle.
 */
export default function Modelo3DPage() {
  // Estado compartido entre visor 3D y controles
  const [shellOpen, setShellOpen] = useState(false);
  const [explode, setExplode] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // El ID activo es el seleccionado o, mientras no haya selección, el que tiene hover
  const activeId = selectedId ?? hoveredId;

  // Handlers para ExplodeControls
  const handleShellToggle = useCallback((open: boolean) => {
    setShellOpen(open);
  }, []);

  const handleExplodeChange = useCallback((value: number) => {
    setExplode(value);
  }, []);

  const handleAutoRotateToggle = useCallback((on: boolean) => {
    setAutoRotate(on);
  }, []);

  const handleResetView = useCallback(() => {
    setShellOpen(false);
    setExplode(0);
    setAutoRotate(false);
    setSelectedId(null);
  }, []);

  const handlePlaySequence = useCallback(() => {
    setShellOpen(true);
    setExplode(1);
  }, []);

  // Handlers para SatelliteModel
  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  // Handler para la lista de componentes (sidebar)
  const handleComponentClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  // Datos del componente activo para la tarjeta de detalle
  const activeLayer = activeId ? LAYERS.find((l) => l.id === activeId) : null;

  return (
    <section aria-labelledby="modelTitle">
      <div className="container section section--tight">
        {/* Encabezado */}
        <div className="section-head">
          <p className="eyebrow">Modelo 3D interactivo</p>
          <h2 id="modelTitle">Cápsula abierta, componentes señalados</h2>
          <p className="muted">
            Arrastra para girar, rueda o pinza para acercar. Abre la carcasa y
            separa las capas para ver las PCBs; al pasar el cursor sobre un
            componente aparece su ficha con el modelo que usamos. Los números
            marcan los puntos críticos del ensamble.
          </p>
        </div>

        {/* Layout principal: visor + sidebar */}
        <div className="model-layout">
          {/* Columna izquierda: stage + controles */}
          <div>
            <SatelliteModelLoader
              layers={LAYERS}
              selectedId={activeId}
              onHover={handleHover}
              onSelect={handleSelect}
              shellOpen={shellOpen}
              explode={explode}
              autoRotate={autoRotate}
            />
            <ExplodeControls
              onShellToggle={handleShellToggle}
              onExplodeChange={handleExplodeChange}
              onAutoRotateToggle={handleAutoRotateToggle}
              onResetView={handleResetView}
              onPlaySequence={handlePlaySequence}
            />
          </div>

          {/* Columna derecha: detalle + lista de componentes */}
          <aside className="grid" style={{ gap: "var(--space-4)" }} aria-label="Componentes del ensamble">
            {/* Tarjeta de detalle */}
            <div className="panel panel--corner detail-card" aria-live="polite">
              <div className="detail-card__head">
                <div>
                  <h3>{activeLayer ? activeLayer.nombre : "Selecciona un componente"}</h3>
                  <p className="detail-card__model">
                    {activeLayer
                      ? activeLayer.modelo
                      : `${LAYERS.length} capas · componentes señalados`}
                  </p>
                </div>
                <span className="badge">
                  {activeLayer ? activeLayer.categoria : "ensamble"}
                </span>
              </div>
              {!activeLayer && (
                <p>
                  Pasa el cursor por el modelo o usa la lista de abajo para ver la
                  ficha técnica de cada pieza.
                </p>
              )}
              {activeLayer?.specs && (
                <table className="kv">
                  <tbody>
                    {Object.entries(activeLayer.specs).map(([key, value]) => (
                      <tr key={key}>
                        <th>{key}</th>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Lista de capas y componentes */}
            <div className="panel" style={{ padding: "var(--space-4)" }}>
              <div className="panel__title">
                <h3 style={{ fontSize: "0.95rem" }}>Capas y componentes</h3>
                <span className="badge badge--amber">{LAYERS.length}</span>
              </div>
              <div className="component-list" role="list">
                {LAYERS.map((layer) => (
                  <button
                    key={layer.id}
                    className="component-item"
                    type="button"
                    data-component={layer.id}
                    aria-pressed={activeId === layer.id}
                    onClick={() => handleComponentClick(layer.id)}
                  >
                    <span
                      className="component-item__swatch"
                      style={{ background: layer.color }}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="component-item__name">{layer.nombre}</span>
                      <span className="component-item__model">{layer.modelo}</span>
                    </span>
                    <span className="component-item__kind">{layer.categoria}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ─── Datos estáticos de capas ─── */

const LAYERS: LayerSpec[] = [
  { id: "tapadera-sup", nombre: "Tapadera superior", modelo: "Tapa cilíndrica impresa en PETG", categoria: "Carcasa", color: "#E7ECF2" },
  { id: "tapadera-inf", nombre: "Tapadera inferior", modelo: "Tapa cilíndrica impresa en PETG", categoria: "Carcasa", color: "#E7ECF2" },
  { id: "base-paracaidas", nombre: "Base del paracaídas", modelo: "Soporte cónico impreso en PETG", categoria: "Recuperación", color: "#5B6C88" },
  { id: "cilindro", nombre: "Cilindro principal", modelo: "Cuerpo cilíndrico impreso en PETG", categoria: "Carcasa", color: "#2A3B57" },
  { id: "pcb-gps-transmisor", nombre: "GPS y transmisor", modelo: "Quectel L70 + etapa TX", categoria: "PCB", color: "#1F6F4A" },
  { id: "pcb-lora", nombre: "Comunicación LoRa", modelo: "Ai-Thinker RA-02 (SX1278)", categoria: "PCB", color: "#16304F" },
  { id: "pcb-sensores", nombre: "Módulo de sensores", modelo: "PCB roja: AK8975, MPU6050, TMP102, BME280", categoria: "PCB", color: "#8E2230" },
  { id: "pcb-microcontrolador", nombre: "Microcontrolador", modelo: "PCB verde de control (MCU por confirmar)", categoria: "PCB", color: "#1F7A44" },
  { id: "pcb-vision", nombre: "Módulo de visión", modelo: "FPGA Spartan-6 XC6SLX6 + SDRAM", categoria: "PCB", color: "#3B2050" },
];
