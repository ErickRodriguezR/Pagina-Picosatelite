"use client";

import { useCallback, useMemo } from "react";
import {
  AltitudeChart,
  LiveTelemetryChart,
  SensorFilterBar,
  DataTable,
  OrientationViewerLoader,
} from "@/components/dashboard";
import { BatteryRocket, TelemetryModeBadge } from "@/components/ui";
import type { Phase, DataTableColumn, PlotlyTrace } from "@/components/dashboard";
import type { TelemetryReading } from "@/lib/api";
import { useLiveTelemetry } from "@/lib/hooks/useLiveTelemetry";
import { exportTelemetryCsv } from "@/lib/utils/exportCsv";

/**
 * Vista 03 — Telemetría (Dashboard)
 *
 * Cumple requisitos TR-02 (10 campos obligatorios + gráfica dinámica)
 * y GSR-02 (exportación a .csv local con timestamps).
 */
export default function DashboardPage() {
  const { readings, status } = useLiveTelemetry();
  const loading = readings.length === 0 && status === "connecting";

  /* ─── Última lectura ─── */
  const last = readings.length > 0 ? readings[readings.length - 1] : null;

  /* ─── KPIs calculados ─── */
  const apogee =
    readings.length > 0 ? Math.max(...readings.map((r) => r.altitud_m)) : null;
  const packetCount = last?.packet_count ?? readings.length;

  /* ─── 10 campos TR-02 obligatorios ─── */
  const tr02Fields: { label: string; value: string; unit: string; tone?: string }[] = last
    ? [
        {
          label: "TEAM_ID",
          value: String(last.team_id).padStart(4, "0"),
          unit: "",
        },
        {
          label: "MISSION_TIME",
          value: last.mission_time,
          unit: "",
        },
        {
          label: "PACKET_COUNT",
          value: String(packetCount),
          unit: "",
          tone: "green",
        },
        {
          label: "ALTITUDE",
          value: last.altitud_m.toFixed(1),
          unit: "m",
          tone: "amber",
        },
        {
          label: "TEMPERATURE",
          value: last.temperatura_c.toFixed(1),
          unit: "°C",
        },
        {
          label: "VOLTAGE",
          value: last.voltage_v.toFixed(2),
          unit: "V",
        },
        {
          label: "ACCEL_X",
          value: last.acelerometro.x.toFixed(2),
          unit: "g",
        },
        {
          label: "ACCEL_Y",
          value: last.acelerometro.y.toFixed(2),
          unit: "g",
        },
        {
          label: "ACCEL_Z",
          value: last.acelerometro.z.toFixed(2),
          unit: "g",
        },
        {
          label: "STATE",
          value: last.state,
          unit: "",
          tone:
            last.state === "LAND"
              ? "green"
              : last.state === "DESC"
              ? "blue"
              : undefined,
        },
      ]
    : [];

  /* ─── KPIs adicionales de misión ─── */
  const missionKpis = [
    {
      label: "Apogeo máx.",
      value: apogee !== null ? apogee.toFixed(1) : "—",
      unit: "m",
      tone: "amber",
    },
    {
      label: "Paquetes totales",
      value: packetCount > 0 ? String(packetCount) : "—",
      unit: "",
      tone: "green",
    },
  ];

  /* ─── Para el visor 3D de orientación ─── */
  const lastGyro = last?.giroscopio ?? null;
  const lastAccel = last?.acelerometro ?? null;

  /* ─── Filas de la tabla de datos crudos ─── */
  const tableRows = readings.map((r) => ({
    packet_count: String(r.packet_count),
    team_id: String(r.team_id).padStart(4, "0"),
    mission_time: r.mission_time,
    estado: r.estado,
    state: r.state,
    altitud: r.altitud_m.toFixed(1),
    temperatura: r.temperatura_c.toFixed(1),
    voltage: r.voltage_v.toFixed(2),
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
    timestamp: r.timestamp.replace("T", " ").replace(".000Z", ""),
  }));

  /* ─── Exportación CSV (GSR-02) ─── */
  const handleExportCsv = useCallback(async () => {
    exportTelemetryCsv(readings);
  }, [readings]);

  /* ─── Tiempo base para el eje X de las gráficas ─── */
  const t0 = readings.length > 0 ? Date.parse(readings[0].timestamp) : 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const xSeconds = useMemo(
    () => readings.map((r) => parseFloat(((Date.parse(r.timestamp) - t0) / 1000).toFixed(1))),
    [readings]
  );

  /* ─── buildTraces: Temperatura ─── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const buildTracesTemp = useCallback((_r: TelemetryReading[]): PlotlyTrace[] => [
    {
      x: xSeconds, y: _r.map((r) => r.temperatura_c),
      type: "scatter", mode: "lines", name: "BMP280 (°C)",
      line: { color: "#f97316", width: 2 },
      hovertemplate: "<b>t=%{x}s</b><br>%{y:.1f} °C<extra>BMP280</extra>",
    },
    {
      x: xSeconds, y: _r.map((r) => r.temperatura_mpu_c),
      type: "scatter", mode: "lines", name: "MPU-6050 (°C)",
      line: { color: "#fb923c", width: 2, dash: "dot" },
      hovertemplate: "<b>t=%{x}s</b><br>%{y:.1f} °C<extra>MPU</extra>",
    },
  ], [xSeconds]);

  /* ─── buildTraces: Presión ─── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const buildTracesPresion = useCallback((_r: TelemetryReading[]): PlotlyTrace[] => [
    {
      x: xSeconds, y: _r.map((r) => r.presion_hpa),
      type: "scatter", mode: "lines", name: "Presión (hPa)",
      line: { color: "#38bdf8", width: 2 },
      hovertemplate: "<b>t=%{x}s</b><br>%{y:.2f} hPa<extra></extra>",
    },
  ], [xSeconds]);

  /* ─── buildTraces: Voltaje de batería ─── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const buildTracesVoltaje = useCallback((_r: TelemetryReading[]): PlotlyTrace[] => [
    {
      x: xSeconds, y: _r.map((r) => r.voltage_v),
      type: "scatter", mode: "lines+markers", name: "Voltaje (V)",
      line: { color: "#a78bfa", width: 2 },
      marker: { size: 4, color: "#a78bfa" },
      hovertemplate: "<b>t=%{x}s</b><br>%{y:.2f} V<extra></extra>",
    },
  ], [xSeconds]);

  /* ─── buildTraces: IMU (|aceleración| y |giroscopio|) ─── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const buildTracesImu = useCallback((_r: TelemetryReading[]): PlotlyTrace[] => [
    {
      x: xSeconds,
      y: _r.map((r) => {
        const { x, y, z } = r.acelerometro;
        return parseFloat(Math.sqrt(x * x + y * y + z * z).toFixed(3));
      }),
      type: "scatter", mode: "lines", name: "|a| (g)",
      line: { color: "#34d399", width: 2 },
      hovertemplate: "<b>t=%{x}s</b><br>|a|=%{y:.3f} g<extra></extra>",
    },
    {
      x: xSeconds,
      y: _r.map((r) => {
        const { x, y, z } = r.giroscopio;
        return parseFloat(Math.sqrt(x * x + y * y + z * z).toFixed(2));
      }),
      type: "scatter", mode: "lines", name: "|ω| (°/s)",
      line: { color: "#6ee7b7", width: 2, dash: "dot" },
      yaxis: "y2",
      hovertemplate: "<b>t=%{x}s</b><br>|ω|=%{y:.2f} °/s<extra></extra>",
    },
  ], [xSeconds]);

  /* ─── buildTraces: Magnetómetro XYZ ─── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const buildTracesMag = useCallback((_r: TelemetryReading[]): PlotlyTrace[] => [
    {
      x: xSeconds, y: _r.map((r) => r.magnetometro.x),
      type: "scatter", mode: "lines", name: "Mag X",
      line: { color: "#f43f5e", width: 2 },
      hovertemplate: "<b>t=%{x}s</b><br>X=%{y}<extra></extra>",
    },
    {
      x: xSeconds, y: _r.map((r) => r.magnetometro.y),
      type: "scatter", mode: "lines", name: "Mag Y",
      line: { color: "#fb7185", width: 2, dash: "dash" },
      hovertemplate: "<b>t=%{x}s</b><br>Y=%{y}<extra></extra>",
    },
    {
      x: xSeconds, y: _r.map((r) => r.magnetometro.z),
      type: "scatter", mode: "lines", name: "Mag Z",
      line: { color: "#fda4af", width: 2, dash: "dot" },
      hovertemplate: "<b>t=%{x}s</b><br>Z=%{y}<extra></extra>",
    },
  ], [xSeconds]);

  /* ─── buildTraces: Trayectoria 3D GPS ─── */
  const buildTracesGps = useCallback((_r: TelemetryReading[]): PlotlyTrace[] => {
    const lats = _r.map((r) => r.gps.lat);
    const lngs = _r.map((r) => r.gps.lng);
    const alts = _r.map((r) => r.gps.alt_m);
    return [
      {
        x: lngs, y: lats, z: alts,
        type: "scatter3d", mode: "lines+markers", name: "Trayectoria GPS",
        line: { color: "#facc15", width: 3 },
        marker: {
          size: 3, color: alts, colorscale: "Viridis", showscale: true,
          colorbar: { title: { text: "Alt (m)" }, thickness: 10, len: 0.6 },
        },
        hovertemplate: "Lng: %{x:.6f}<br>Lat: %{y:.6f}<br>Alt: %{z:.1f} m<extra></extra>",
      },
    ];
  }, []);

  return (
    <section aria-labelledby="telemetryTitle">
      <div className="container section section--tight">

        {/* ── Encabezado ── */}
        <div className="section-head">
          <p className="eyebrow">Telemetría</p>
          <h2 id="telemetryTitle">Datos captados durante el vuelo</h2>
          <p className="muted">
            Estación de tierra · trama TR-02 · {" "}
            <span className="mono" style={{ fontSize: "0.8em" }}>
              TEAM_ID, MISSION_TIME, PACKET_COUNT, ALTITUDE, TEMPERATURE,
              VOLTAGE, ACCEL_X/Y/Z, STATE
            </span>
          </p>
        </div>

        {/* ── Indicador EN VIVO ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
          <LiveStatusBadge status={status} />
          <TelemetryModeBadge mode={status === "mock" ? 0 : 1} />
          {last && <BatteryRocket percentage={(last.voltage_v / 7.4) * 100} />}
        </div>

        {/* ── 10 campos TR-02 obligatorios ── */}
        {last ? (
          <div
            className="kpi-grid"
            aria-label="10 campos obligatorios TR-02"
            style={{ marginBottom: "var(--space-5)" }}
          >
            {tr02Fields.map((f) => (
              <Tr02Card key={f.label} {...f} />
            ))}
          </div>
        ) : (
          <div
            className="panel"
            style={{
              padding: "var(--space-4)",
              marginBottom: "var(--space-5)",
              textAlign: "center",
            }}
            aria-live="polite"
          >
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              {loading
                ? "Conectando a la estación de tierra…"
                : "Sin datos de telemetría aún."}
            </p>
          </div>
        )}

        {/* ── KPIs adicionales de misión ── */}
        <div
          className="kpi-grid"
          aria-label="Indicadores de misión"
          style={{ marginBottom: "var(--space-5)" }}
        >
          {missionKpis.map((k) => (
            <Tr02Card key={k.label} {...k} />
          ))}
        </div>

        {/* ── Gráfica obligatoria TR-02: Altitud vs Tiempo ── */}
        <AltitudeChart readings={readings} />

        {/* ── Barra de filtros y exportación ── */}
        <SensorFilterBar
          phases={PHASES}
          summary={
            loading
              ? "Conectando…"
              : `${packetCount} paquetes recibidos`
          }
          exportButton={
            <CsvExportButton
              onExport={handleExportCsv}
              disabled={readings.length === 0}
            />
          }
        />

        {/* ── Gráficas complementarias ── */}
        <div className="chart-grid" style={{ marginTop: "var(--space-4)" }}>
          <LiveTelemetryChart
            title="Temperatura"
            hint="BMP280 + MPU-6050 (interna)"
            readings={readings}
            buildTraces={buildTracesTemp}
            layoutOverride={{
              yaxis: { title: { text: "°C", standoff: 8 }, gridcolor: "#1e293b", zerolinecolor: "#334155", tickfont: { size: 10 } },
            }}
          />
          <LiveTelemetryChart
            title="Presión barométrica"
            hint="BMP280"
            readings={readings}
            buildTraces={buildTracesPresion}
            layoutOverride={{
              yaxis: { title: { text: "hPa", standoff: 8 }, gridcolor: "#1e293b", zerolinecolor: "#334155", tickfont: { size: 10 } },
            }}
          />
          <LiveTelemetryChart
            title="Voltaje de batería"
            hint="Batería"
            readings={readings}
            buildTraces={buildTracesVoltaje}
            layoutOverride={{
              yaxis: { title: { text: "V", standoff: 8 }, gridcolor: "#1e293b", zerolinecolor: "#334155", tickfont: { size: 10 } },
            }}
          />
          <LiveTelemetryChart
            title="Inercial"
            hint="MPU-6050 · |a| (g) y |ω| (°/s)"
            readings={readings}
            buildTraces={buildTracesImu}
            layoutOverride={{
              yaxis:  { title: { text: "|a| (g)", standoff: 8 }, gridcolor: "#1e293b", zerolinecolor: "#334155", tickfont: { size: 10 } },
              yaxis2: { title: { text: "|ω| (°/s)", standoff: 8 }, overlaying: "y", side: "right", gridcolor: "#1e293b", zerolinecolor: "#334155", tickfont: { size: 10 } },
            }}
          />
          <LiveTelemetryChart
            title="Magnetómetro"
            hint="QMC5883P · campo magnético XYZ"
            readings={readings}
            buildTraces={buildTracesMag}
            layoutOverride={{
              yaxis: { title: { text: "µT", standoff: 8 }, gridcolor: "#1e293b", zerolinecolor: "#334155", tickfont: { size: 10 } },
            }}
          />
          <LiveTelemetryChart
            title="Trayectoria 3D"
            hint="GPS ATGM336H · lat/lng/altitud, arrastra para girar"
            wide
            tall
            readings={readings}
            buildTraces={buildTracesGps}
            layoutOverride={{
              scene: {
                xaxis: { title: "Longitud", gridcolor: "#1e293b", zerolinecolor: "#334155" },
                yaxis: { title: "Latitud",  gridcolor: "#1e293b", zerolinecolor: "#334155" },
                zaxis: { title: "Altitud (m)", gridcolor: "#1e293b", zerolinecolor: "#334155" },
                bgcolor: "transparent",
              },
            }}
          />
        </div>

        {/* ── Visor 3D de orientación ── */}
        <div style={{ marginTop: "var(--space-6)" }}>
          <OrientationViewerLoader gyro={lastGyro} accel={lastAccel} />
        </div>

        {/* ── Tabla de datos crudos ── */}
        <DataTable columns={TABLE_COLUMNS} rows={tableRows} />
      </div>
    </section>
  );
}

/* ─── Indicador EN VIVO ────────────────────────────────────────────────────── */

type LiveStatus = "connecting" | "live" | "reconnecting" | "mock";

function LiveStatusBadge({ status }: { status: LiveStatus }) {
  const configs: Record<LiveStatus, { dot: string; text: string; color: string }> = {
    live:         { dot: "●", text: "EN VIVO",       color: "#22c55e" },
    connecting:   { dot: "○", text: "Conectando…",   color: "#f59e0b" },
    reconnecting: { dot: "○", text: "Reconectando…", color: "#ef4444" },
    mock:         { dot: "◆", text: "Datos de demo", color: "#6b7280" },
  };
  const { dot, text, color } = configs[status];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        marginBottom: "var(--space-4)",
        fontSize: "0.85rem",
        fontWeight: 600,
        color,
      }}
      aria-live="polite"
      aria-label={`Estado de conexión: ${text}`}
    >
      <span style={{ fontSize: "0.7rem" }}>{dot}</span>
      {text}
    </div>
  );
}

/* ─── Card TR-02 ────────────────────────────────────────────────────────────── */

interface Tr02CardProps {
  label: string;
  value: string;
  unit: string;
  tone?: string;
}

function Tr02Card({ label, value, unit, tone }: Tr02CardProps) {
  const toneClass = tone ? ` stat--${tone}` : "";
  return (
    <div className={`panel kpi stat${toneClass}`}>
      <span className="stat__label mono" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span className="stat__value">
        {value}
        {unit && <small style={{ marginLeft: "0.25em" }}>{unit}</small>}
      </span>
    </div>
  );
}

/* ─── Botón exportar CSV ────────────────────────────────────────────────────── */

interface CsvExportButtonProps {
  onExport: () => Promise<void>;
  disabled?: boolean;
}

function CsvExportButton({ onExport, disabled = false }: CsvExportButtonProps) {
  return (
    <button
      className="btn btn--primary btn--sm"
      type="button"
      disabled={disabled}
      onClick={onExport}
      title="Descargar telemetría como .csv (GSR-02)"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 1.5v8m0 0L5 6.5m3 3 3-3M2.5 11.5v2h11v-2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      Descargar .csv
    </button>
  );
}

/* ─── Datos estáticos ─── */

const PHASES: Phase[] = [
  { key: "pre-lanzamiento", label: "Pre-lanzamiento" },
  { key: "ascenso", label: "Ascenso" },
  { key: "descenso", label: "Descenso" },
  { key: "aterrizado", label: "Aterrizado" },
];

const TABLE_COLUMNS: DataTableColumn[] = [
  { key: "packet_count", label: "PKT#" },
  { key: "team_id",      label: "TEAM_ID" },
  { key: "mission_time", label: "MISSION_TIME" },
  { key: "state",        label: "STATE" },
  { key: "altitud",      label: "ALTITUDE (m)" },
  { key: "temperatura",  label: "TEMP (°C)" },
  { key: "voltage",      label: "VOLTAGE (V)" },
  { key: "acel_x",       label: "ACCEL_X (g)" },
  { key: "acel_y",       label: "ACCEL_Y (g)" },
  { key: "acel_z",       label: "ACCEL_Z (g)" },
  { key: "temperatura_mpu", label: "Temp. MPU (°C)" },
  { key: "presion",      label: "Pres. (hPa)" },
  { key: "giro_x",       label: "Giro X (°/s)" },
  { key: "giro_y",       label: "Giro Y (°/s)" },
  { key: "giro_z",       label: "Giro Z (°/s)" },
  { key: "mag_x",        label: "Mag X" },
  { key: "mag_y",        label: "Mag Y" },
  { key: "mag_z",        label: "Mag Z" },
  { key: "rssi",         label: "RSSI (dBm)" },
  { key: "lat",          label: "Lat." },
  { key: "lng",          label: "Lng." },
  { key: "satelites",    label: "Sat." },
  { key: "timestamp",    label: "Timestamp (UTC)" },
  { key: "estado",       label: "Fase" },
];
