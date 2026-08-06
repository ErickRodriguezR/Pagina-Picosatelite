"use client";

import { TelemetryChart, SensorFilterBar, ExportButton, DataTable } from "@/components/dashboard";
import type { Phase, DataTableColumn } from "@/components/dashboard";

/**
 * Vista 03 — Telemetría (Dashboard)
 * Usa los componentes de components/dashboard/ para filtros, gráficas,
 * tabla y exportación. Los datos vendrán de lib/api/client.ts.
 */
export default function DashboardPage() {
  return (
    <section aria-labelledby="telemetryTitle">
      <div className="container section section--tight">
        {/* Encabezado */}
        <div className="section-head">
          <p className="eyebrow">Telemetría</p>
          <h2 id="telemetryTitle">Datos captados durante el vuelo</h2>
          <p className="muted">
            Cada paquete recibido por la estación de tierra, con gráficas para el
            análisis detallado y descarga en Excel de la selección actual.
          </p>
        </div>

        {/* KPIs */}
        <div className="kpi-grid" aria-label="Indicadores del vuelo">
          {KPI_CARDS.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Filtros */}
        <SensorFilterBar
          phases={PHASES}
          summary="— de — paquetes en la selección"
          exportButton={<ExportButton onExport={handleExportPlaceholder} />}
        />

        {/* Gráficas */}
        <div className="chart-grid" style={{ marginTop: "var(--space-4)" }}>
          <TelemetryChart id="plotAltitude" title="Altitud vs. tiempo" hint="zoom con arrastre · doble clic para reiniciar" wide tall />
          <TelemetryChart id="plotTempHum" title="Temperatura y humedad" hint="TMP102 · BME280" />
          <TelemetryChart id="plotPressure" title="Presión barométrica" hint="BME280" />
          <TelemetryChart id="plotPower" title="Enlace LoRa" hint="RSSI dBm" />
          <TelemetryChart id="plotImu" title="Inercial" hint="MPU6050 · |a| y |ω|" />
          <TelemetryChart id="plotTrajectory" title="Trayectoria 3D" hint="GPS L70 · lat/lng/altitud, arrastra para girar" wide tall />
        </div>

        {/* Tabla de datos crudos */}
        <DataTable columns={TABLE_COLUMNS} rows={[]} />
      </div>
    </section>
  );
}

/* ─── Componentes locales ─── */

function KpiCard({ label, value, unit, tone }: { label: string; value: string; unit: string; tone?: string }) {
  return (
    <div className={`panel kpi stat${tone ? ` stat--${tone}` : ""}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">
        {value}
        {unit && <small>{unit}</small>}
      </span>
    </div>
  );
}

/* ─── Placeholder de exportación (se conectará a lib/api) ─── */

async function handleExportPlaceholder(): Promise<void> {
  // TODO: conectar con SheetJS + lib/api/client.ts
  await new Promise((resolve) => setTimeout(resolve, 500));
}

/* ─── Datos estáticos ─── */

const KPI_CARDS = [
  { label: "Apogeo", value: "—", unit: "m", tone: "amber" },
  { label: "Temp. mínima", value: "—", unit: "°C" },
  { label: "Presión mínima", value: "—", unit: "hPa" },
  { label: "RSSI mínimo", value: "—", unit: "dBm" },
  { label: "Paquetes", value: "—", unit: "", tone: "green" },
];

const PHASES: Phase[] = [
  { key: "pre-lanzamiento", label: "Pre-lanzamiento" },
  { key: "ascenso", label: "Ascenso" },
  { key: "descenso", label: "Descenso" },
  { key: "aterrizado", label: "Aterrizado" },
];

const TABLE_COLUMNS: DataTableColumn[] = [
  { key: "timestamp", label: "Timestamp (UTC)" },
  { key: "estado", label: "Fase" },
  { key: "altitud", label: "Alt. (m)" },
  { key: "temperatura", label: "Temp. (°C)" },
  { key: "presion", label: "Pres. (hPa)" },
  { key: "humedad", label: "Hum. (%)" },

  { key: "rssi", label: "RSSI (dBm)" },
  { key: "lat", label: "Lat." },
  { key: "lng", label: "Lng." },
  { key: "satelites", label: "Sat." },
];
