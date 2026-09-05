/**
 * exportCsv.ts
 *
 * Cumple requisito GSR-02: genera y descarga un archivo .csv local con
 * toda la telemetría recibida, incluyendo timestamps de la computadora.
 *
 * El archivo resultante es el entregable oficial auditado por el jurado.
 *
 * Cabecera del CSV (orden TR-02 primero, luego campos complementarios):
 * TEAM_ID, MISSION_TIME, PACKET_COUNT, ALTITUDE_M, TEMPERATURE_C,
 * VOLTAGE_V, ACCEL_X, ACCEL_Y, ACCEL_Z, STATE,
 * TIMESTAMP_UTC, TIMESTAMP_LOCAL, FASE, TEMP_MPU_C, PRESION_HPA,
 * GYRO_X, GYRO_Y, GYRO_Z, MAG_X, MAG_Y, MAG_Z,
 * RSSI_DBM, VEL_VERTICAL_MS, GPS_LAT, GPS_LNG, GPS_ALT_M, GPS_SATS
 */

import type { TelemetryReading } from "@/lib/api/types";

const CSV_HEADER = [
  "TEAM_ID",
  "MISSION_TIME",
  "PACKET_COUNT",
  "ALTITUDE_M",
  "TEMPERATURE_C",
  "VOLTAGE_V",
  "ACCEL_X",
  "ACCEL_Y",
  "ACCEL_Z",
  "STATE",
  "TIMESTAMP_UTC",
  "TIMESTAMP_LOCAL",
  "FASE",
  "TEMP_MPU_C",
  "PRESION_HPA",
  "GYRO_X",
  "GYRO_Y",
  "GYRO_Z",
  "MAG_X",
  "MAG_Y",
  "MAG_Z",
  "RSSI_DBM",
  "VEL_VERTICAL_MS",
  "GPS_LAT",
  "GPS_LNG",
  "GPS_ALT_M",
  "GPS_SATS",
].join(",");

/** Escapa un valor para CSV: envuelve en comillas si contiene coma o comilla. */
function csvEscape(value: string | number | undefined | null): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Convierte un timestamp UTC ISO 8601 al horario local de la computadora. */
function toLocalTimestamp(utcIso: string): string {
  try {
    const d = new Date(utcIso);
    // Formato ISO local sin timezone offset
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
  } catch {
    return utcIso;
  }
}

/** Convierte un array de lecturas a string CSV. */
function readingsToCsv(readings: TelemetryReading[]): string {
  const rows = readings.map((r) => {
    const cols = [
      String(r.team_id).padStart(4, "0"),
      r.mission_time,
      r.packet_count,
      r.altitud_m.toFixed(1),
      r.temperatura_c.toFixed(1),
      r.voltage_v.toFixed(2),
      r.acelerometro.x.toFixed(2),
      r.acelerometro.y.toFixed(2),
      r.acelerometro.z.toFixed(2),
      r.state,
      r.timestamp.replace("T", " ").replace(".000Z", ""),
      toLocalTimestamp(r.timestamp),
      r.estado,
      r.temperatura_mpu_c.toFixed(2),
      r.presion_hpa.toFixed(2),
      r.giroscopio.x.toFixed(2),
      r.giroscopio.y.toFixed(2),
      r.giroscopio.z.toFixed(2),
      r.magnetometro.x,
      r.magnetometro.y,
      r.magnetometro.z,
      r.rssi_dbm.toFixed(1),
      r.velocidad_vertical_ms?.toFixed(2) ?? "",
      r.gps.lat.toFixed(6),
      r.gps.lng.toFixed(6),
      r.gps.alt_m.toFixed(1),
      r.gps.satelites,
    ];
    return cols.map(csvEscape).join(",");
  });

  return [CSV_HEADER, ...rows].join("\r\n");
}

/**
 * Genera el nombre de archivo con la fecha/hora local de descarga.
 * Formato: telemetry_TEAM1024_YYYYMMDD_HHMMSS.csv
 */
function buildFilename(teamId: number): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time =
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `telemetry_TEAM${String(teamId).padStart(4, "0")}_${date}_${time}.csv`;
}

/**
 * Dispara la descarga del archivo .csv en el navegador.
 * Llamar desde el botón "Descargar .csv" en el dashboard.
 */
export function exportTelemetryCsv(readings: TelemetryReading[]): void {
  if (readings.length === 0) return;

  const csvContent = readingsToCsv(readings);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const teamId = readings[0].team_id;
  const filename = buildFilename(teamId);

  // Crea un enlace temporal, hace clic programático y libera el objeto URL
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Libera la URL del objeto Blob después de un tick
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
