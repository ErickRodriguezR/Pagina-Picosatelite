"use client";

import { useEffect, useState } from "react";
import { TelemetryChart, SensorFilterBar, ExportButton, DataTable, OrientationViewerLoader } from "@/components/dashboard";
import type { Phase, DataTableColumn } from "@/components/dashboard";
import { DataClient } from "@/lib/api";
import type { TelemetryReading } from "@/lib/api";

/**
 * Vista 03 — Telemetría (Dashboard)
 * Carga datos desde DataClient (mock o API real) y los muestra
 * en KPIs, gráficas y tabla de datos crudos.
 */
export default function DashboardPage() {
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataClient.getTelemetry().then((data) => {
      setReadings(data);
      setLoading(false);
    });
  }, []);

  /* ─── KPIs calculados desde los datos ─── */
  const apogee = readings.length > 0 ? Math.max(...readings.map((r) => r.altitud_m)) : null;
  const minTemp = readings.length > 0 ? Math.min(...readings.map((r) => r.temperatura_c)) : null;
  const minPressure = readings.length > 0 ? Math.min(...readings.map((r) => r.presion_hpa)) : null;
  const minRssi = readings.length > 0 ? Math.min(...readings.map((r) => r.rssi_dbm)) : null;
  const packetCount = readings.length;

  const kpiCards = [
    { label: "Apogeo", value: apogee !== null ? apogee.toFixed(1) : "—", unit: "m", tone: "amber" },
    { label: "Temp. mínima", value: minTemp !== null ? minTemp.toFixed(2) : "—", unit: "°C" },
    { label: "Presión mínima", value: minPressure !== null ? minPressure.toFixed(2) : "—", unit: "hPa" },
    { label: "RSSI mínimo", value: minRssi !== null ? minRssi.toFixed(1) : "—", unit: "dBm" },
    { label: "Paquetes", value: packetCount > 0 ? String(packetCount) : "—", unit: "", tone: "green" },
  ];

  /* ─── Última lectura para el visor 3D ─── */
  const lastReading = readings.length > 0 ? readings[readings.length - 1] : null;
  const lastGyro = lastReading ? lastReading.giroscopio : null;
  const lastAccel = lastReading ? lastReading.acelerometro : null;

  /* ─── Filas de la tabla ─── */
  const tableRows = readings.map((r) => ({
    timestamp: r.timestamp.replace("T", " ").replace(".000Z", ""),
    estado: r.estado,
    altitud: r.altitud_m.toFixed(1),
    temperatura: r.temperatura_c.toFixed(2),
    temperatura_mpu: r.temperatura_mpu_c.toFixed(2),
    presion: r.presion_hpa.toFixed(2),
    acel_x: r.acelerometro.x.toFixed(2),
    acel_y: r.acelerometro.y.toFixed(2),
    acel_z: r.acelerometro.z.toFixed(2),
    giro_x: r.giroscopio.x.toFixed(2),
    giro_y: r.giroscopio.y.toFixed(2),
    giro_z: r.giroscopio.z.toFixed(2),
    mag_x: String(r.magnetometro.x),
    mag_y: String(r.magnetometro.y),
    mag_z: String(r.magnetometro.z),
    rssi: r.rssi_dbm.toFixed(1),
    lat: r.gps.lat.toFixed(6),
    lng: r.gps.lng.toFixed(6),
    satelites: String(r.gps.satelites),
  }));

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
          {kpiCards.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Filtros */}
        <SensorFilterBar
          phases={PHASES}
          summary={loading ? "Cargando…" : `${packetCount} paquetes recibidos`}
          exportButton={<ExportButton onExport={handleExportPlaceholder} />}
        />

        {/* Gráficas */}
        <div className="chart-grid" style={{ marginTop: "var(--space-4)" }}>
          <TelemetryChart id="plotAltitude" title="Altitud vs. tiempo" hint="BMP280 · zoom con arrastre · doble clic para reiniciar" wide tall />
          <TelemetryChart id="plotTemp" title="Temperatura" hint="BMP280 + MPU-6050 (interna)" />
          <TelemetryChart id="plotPressure" title="Presión barométrica" hint="BMP280" />
          <TelemetryChart id="plotPower" title="Enlace LoRa" hint="RSSI dBm" />
          <TelemetryChart id="plotImu" title="Inercial" hint="MPU-6050 · |a| y |ω|" />
          <TelemetryChart id="plotMag" title="Magnetómetro" hint="QMC5883P · campo magnético XYZ" />
          <TelemetryChart id="plotTrajectory" title="Trayectoria 3D" hint="GPS ATGM336H · lat/lng/altitud, arrastra para girar" wide tall />
        </div>

        {/* Visor 3D de orientación */}
        <div style={{ marginTop: "var(--space-6)" }}>
          <OrientationViewerLoader gyro={lastGyro} accel={lastAccel} />
        </div>

        {/* Tabla de datos crudos */}
        <DataTable columns={TABLE_COLUMNS} rows={tableRows} />
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
  { key: "temperatura", label: "Temp. BMP (°C)" },
  { key: "temperatura_mpu", label: "Temp. MPU (°C)" },
  { key: "presion", label: "Pres. (hPa)" },
  { key: "acel_x", label: "Acel X (g)" },
  { key: "acel_y", label: "Acel Y (g)" },
  { key: "acel_z", label: "Acel Z (g)" },
  { key: "giro_x", label: "Giro X (°/s)" },
  { key: "giro_y", label: "Giro Y (°/s)" },
  { key: "giro_z", label: "Giro Z (°/s)" },
  { key: "mag_x", label: "Mag X" },
  { key: "mag_y", label: "Mag Y" },
  { key: "mag_z", label: "Mag Z" },
  { key: "rssi", label: "RSSI (dBm)" },
  { key: "lat", label: "Lat." },
  { key: "lng", label: "Lng." },
  { key: "satelites", label: "Sat." },
];
