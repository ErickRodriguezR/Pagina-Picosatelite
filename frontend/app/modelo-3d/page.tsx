import { ExplodeControls } from "@/components/model3d";
import { SatelliteModelLoader } from "@/components/model3d/SatelliteModelLoader";
import type { LayerSpec } from "@/components/model3d";

/**
 * Vista 02 — Modelo 3D interactivo
 * Usa los componentes de components/model3d/ para el visor, controles
 * y la lista de capas/tarjeta de detalle.
 */
export default function Modelo3DPage() {
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
          <div className="notice" role="note">
            <InfoIcon />
            <p>
              Geometría <b>placeholder</b> hecha con primitivas de Three.js: la
              interacción (hover, ficha, apertura y explosión) ya es la
              definitiva. Cuando exista el <span className="mono">.glb</span>{" "}
              real modelado en CAD, se reemplazan las mallas sin tocar la lógica.
            </p>
          </div>
        </div>

        {/* Layout principal: visor + sidebar */}
        <div className="model-layout">
          {/* Columna izquierda: stage + controles */}
          <div>
            <SatelliteModelLoader layers={LAYERS} />
            <ExplodeControls />
          </div>

          {/* Columna derecha: detalle + lista de componentes */}
          <aside className="grid" style={{ gap: "var(--space-4)" }} aria-label="Componentes del ensamble">
            {/* Tarjeta de detalle */}
            <div className="panel panel--corner detail-card" aria-live="polite">
              <div className="detail-card__head">
                <div>
                  <h3>Selecciona un componente</h3>
                  <p className="detail-card__model">
                    {LAYERS.length} capas · componentes señalados
                  </p>
                </div>
                <span className="badge">ensamble</span>
              </div>
              <p>
                Pasa el cursor por el modelo o usa la lista de abajo para ver la
                ficha técnica de cada pieza.
              </p>
              <table className="kv">
                <tbody />
              </table>
              <div className="chip-row" />
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
                    aria-pressed="false"
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

/* ─── Datos estáticos de capas (se moverán a lib/api/mock) ─── */

const LAYERS: LayerSpec[] = [
  { id: "paracaidas", nombre: "Paracaídas", modelo: "Domo hemisférico de nylon ripstop, Ø450 mm", categoria: "Recuperación", color: "#E7ECF2" },
  { id: "pcb-gps-transmisor", nombre: "GPS y transmisor", modelo: "Quectel L70 + etapa TX", categoria: "PCB", color: "#1F6F4A" },
  { id: "pcb-lora", nombre: "Comunicación LoRa", modelo: "Ai-Thinker RA-02 (SX1278)", categoria: "PCB", color: "#16304F" },
  { id: "pcb-sensores", nombre: "Módulo de sensores", modelo: "PCB roja: AK8975, MPU6050, TMP102, BME280", categoria: "PCB", color: "#8E2230" },
  { id: "pcb-microcontrolador", nombre: "Microcontrolador", modelo: "PCB verde de control (MCU por confirmar)", categoria: "PCB", color: "#1F7A44" },
  { id: "interruptor", nombre: "Interruptor de encendido", modelo: "Interruptor deslizante lateral", categoria: "Control", color: "#FFB020" },
  { id: "bateria", nombre: "Batería", modelo: "LiPo 1S 1200 mAh (bolsa)", categoria: "Energía", color: "#243755" },
  { id: "pcb-vision", nombre: "Módulo de visión", modelo: "FPGA Spartan-6 XC6SLX6 + SDRAM", categoria: "PCB", color: "#3B2050" },
  { id: "camara", nombre: "Cámara fotográfica", modelo: "OV7670 con lente M12", categoria: "Carga útil", color: "#0E1726" },
  { id: "estructura", nombre: "Estructura en 3D", modelo: "Bastidor PETG + 4 varillas guía M3", categoria: "Mecánica", color: "#5B6C88" },
];

/* ─── Íconos ─── */

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flex: "none", marginTop: 2 }}>
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" />
      <path d="M9 5.5v.5M9 8v4.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}
