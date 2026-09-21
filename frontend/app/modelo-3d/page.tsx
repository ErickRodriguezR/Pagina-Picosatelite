"use client";

import { useState, useCallback } from "react";
import { ExplodeControls } from "@/components/model3d";
import { SatelliteModelLoader } from "@/components/model3d/SatelliteModelLoader";
import type { LayerSpec } from "@/components/model3d";

const MODEL_VIEW_LABELS = [
  "Carcasa y paracaídas",
  "Componentes y PCBs",
  "Protección del huevo",
  "Todo junto",
] as const;

/**
 * Vista 02 — Modelo 3D interactivo
 * Usa los componentes de components/model3d/ para el visor, controles
 * y la lista de capas/tarjeta de detalle.
 */
export default function Modelo3DPage() {
  // Estado compartido entre visor 3D y controles
  const [autoRotate, setAutoRotate] = useState(false);
  const [viewIndex, setViewIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // El ID activo es el seleccionado o, mientras no haya selección, el que tiene hover
  const activeId = selectedId ?? hoveredId;

  const handleAutoRotateToggle = useCallback((on: boolean) => {
    setAutoRotate(on);
  }, []);

  const handleResetView = useCallback(() => {
    setAutoRotate(false);
    setSelectedId(null);
    setHoveredId(null);
  }, []);

  // Handlers para SatelliteModel
  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const handleViewChange = useCallback((nextIndex: number) => {
    const nextView = Math.min(Math.max(nextIndex, 0), MODEL_VIEW_LABELS.length - 1);
    setViewIndex(nextView);
    setSelectedId(null);
    setHoveredId(null);
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
               viewIndex={viewIndex}
              autoRotate={autoRotate}
            />
            <ExplodeControls
              key={viewIndex}
              viewIndex={viewIndex}
              viewLabels={MODEL_VIEW_LABELS}
              onViewChange={handleViewChange}
              onAutoRotateToggle={handleAutoRotateToggle}
              onResetView={handleResetView}
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
  { id: "tapadera-sup", nombre: "Tapadera roscada superior", modelo: "threaded_lid_top", categoria: "Carcasa", color: "#E7ECF2" },
  { id: "tapadera-inf", nombre: "Tapadera roscada inferior", modelo: "threaded_lid_bottom", categoria: "Carcasa", color: "#E7ECF2" },
  { id: "base-paracaidas", nombre: "Base del paracaídas", modelo: "base_paracaidas.001", categoria: "Recuperación", color: "#5B6C88" },
  { id: "cilindro", nombre: "Cilindro principal", modelo: "cilindro.001", categoria: "Carcasa", color: "#2A3B57" },
  { id: "paracaidas", nombre: "Paracaídas", modelo: "Parachute+", categoria: "Recuperación", color: "#D8DEE8" },

  /* ── PCB brain (3D_pcbBase) ── */
  { id: "pcb-base", nombre: "PCB Base (brain)", modelo: "pcb_base", categoria: "PCB", color: "#1F7A44" },
  { id: "rp2040-zero", nombre: "Microcontrolador RP2040-Zero", modelo: "rp2040_zero", categoria: "brain", color: "#2E9E5B" },
  { id: "sd-reader", nombre: "Lector microSD", modelo: "sd_reader", categoria: "brain", color: "#3FB273" },

  /* ── PCB Metrics (3D_pcbMid) ── */
  { id: "pcb-mid", nombre: "PCB Metrics (sensores)", modelo: "pcb_mid", categoria: "PCB", color: "#8E2230" },
  { id: "bmp280", nombre: "Barómetro BMP280", modelo: "bmp280", categoria: "Metrics", color: "#A83244" },
  { id: "mpu6050", nombre: "IMU MPU-6050", modelo: "mpu6050", categoria: "Metrics", color: "#BF4256" },
  { id: "qmc5883p", nombre: "Magnetómetro QMC5883P", modelo: "qmc5883p", categoria: "Metrics", color: "#D25668" },

  /* ── PCB Top (3D_pcbTop) ── */
  { id: "pcb-top", nombre: "PCB Top (comunicaciones)", modelo: "pcb_top", categoria: "PCB", color: "#16304F" },
  { id: "atgm336h", nombre: "GPS ATGM336H", modelo: "gps", categoria: "Top", color: "#1F6F4A" },
  { id: "lora", nombre: "Radio LoRa", modelo: "lora", categoria: "Top", color: "#274B7A" },

  /* ── Energía y periféricos ── */
  { id: "bateria", nombre: "Batería", modelo: "battery", categoria: "Energía", color: "#4A90D9" },
  { id: "xl6009", nombre: "Regulador XL6009", modelo: "xl6009", categoria: "Energía", color: "#F0A020" },
  { id: "sg90-servo", nombre: "Servo SG90", modelo: "SG90-Servo", categoria: "Actuadores", color: "#7A6CD9" },

  /* ── Protección del huevo ── */
  { id: "egg", nombre: "Huevo de prueba", modelo: "egg", categoria: "Protección", color: "#E7ECF2" },
  { id: "egg-protection", nombre: "Estructura protectora", modelo: "cono_inf001 / cono_superior001", categoria: "Protección", color: "#5B6C88" },
  { id: "estructura", nombre: "Estructura interna", modelo: "parte_inferior001 / parte_superior001", categoria: "Estructura", color: "#5B6C88" },
];
