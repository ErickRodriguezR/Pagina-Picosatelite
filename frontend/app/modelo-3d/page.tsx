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
  const [explodePerLayer, setExplodePerLayer] = useState<Record<string, number>>({});
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
              selectedId={selectedId}
              hoveredId={hoveredId}
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
                    onMouseEnter={() => handleHover(layer.id)}
                    onMouseLeave={() => handleHover(null)}
                    onFocus={() => handleHover(layer.id)}
                    onBlur={() => handleHover(null)}
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
/*
 * Lista de componentes derivada del Outliner de Blender.
 * Estructura por PCB:
 *   · brain   → 3D_pcbBase : RP2040-Zero, SD Reader
 *   · Metrics → 3D_pcbMid  : BMP280, MPU6050, QMC5883P
 *   · Top     → 3D_pcbTop  : ATGM336H (GPS), LoRa
 * Más los componentes sueltos de la colección y estructura.
 * El campo `modelo` coincide con el nombre del objeto en Blender.
 */

const LAYERS: LayerSpec[] = [
  /* ── Carcasa / estructura ── */
  { id: "tapadera-sup", nombre: "Tapadera superior", modelo: "tapadera_sup.001", categoria: "Carcasa", color: "#E7ECF2" },
  { id: "tapadera-inf", nombre: "Tapadera inferior", modelo: "tapadera_inf.001", categoria: "Carcasa", color: "#E7ECF2" },
  { id: "base-paracaidas", nombre: "Base del paracaídas", modelo: "base_paracaidas.001", categoria: "Recuperación", color: "#5B6C88" },
  { id: "cilindro", nombre: "Cilindro principal", modelo: "cilindro.001", categoria: "Carcasa", color: "#2A3B57" },
  { id: "paracaidas", nombre: "Paracaídas", modelo: "Parachute+", categoria: "Recuperación", color: "#D8DEE8" },

  /* ── PCB brain (3D_pcbBase) ── */
  { id: "pcb-base", nombre: "PCB Base (brain)", modelo: "3D_pcbBase_2026-08-27", categoria: "PCB", color: "#1F7A44" },
  { id: "rp2040-zero", nombre: "Microcontrolador RP2040-Zero", modelo: "RP2040-zero", categoria: "brain", color: "#2E9E5B" },
  { id: "sd-reader", nombre: "Lector microSD", modelo: "SD Reader.001", categoria: "brain", color: "#3FB273" },

  /* ── PCB Metrics (3D_pcbMid) ── */
  { id: "pcb-mid", nombre: "PCB Metrics (sensores)", modelo: "3D_pcbMid_2026-08-27", categoria: "PCB", color: "#8E2230" },
  { id: "bmp280", nombre: "Barómetro BMP280", modelo: "BMP280", categoria: "Metrics", color: "#A83244" },
  { id: "mpu6050", nombre: "IMU MPU-6050", modelo: "MPU 6050", categoria: "Metrics", color: "#BF4256" },
  { id: "qmc5883p", nombre: "Magnetómetro QMC5883P", modelo: "QMC5883P", categoria: "Metrics", color: "#D25668" },

  /* ── PCB Top (3D_pcbTop) ── */
  { id: "pcb-top", nombre: "PCB Top (comunicaciones)", modelo: "3D_pcbTop_2026-08-27", categoria: "PCB", color: "#16304F" },
  { id: "atgm336h", nombre: "GPS ATGM336H", modelo: "ATGM336H", categoria: "Top", color: "#1F6F4A" },
  { id: "lora", nombre: "Radio LoRa", modelo: "LoRa", categoria: "Top", color: "#274B7A" },

  /* ── Energía y periféricos ── */
  { id: "bateria", nombre: "Batería", modelo: "Batery", categoria: "Energía", color: "#4A90D9" },
  { id: "xl6009", nombre: "Regulador XL6009", modelo: "XL6009", categoria: "Energía", color: "#F0A020" },
  { id: "sg90-servo", nombre: "Servo SG90", modelo: "SG90-Servo", categoria: "Actuadores", color: "#7A6CD9" },
];
