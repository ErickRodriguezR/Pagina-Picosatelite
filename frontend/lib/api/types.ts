export type FlightPhase =
  | "pre-lanzamiento"
  | "ascenso"
  | "descenso"
  | "aterrizado";

/**
 * Estado de misión TR-02 (exactamente 4 caracteres).
 * WAIT = en espera/pre-lanzamiento
 * DESC = descenso
 * LAND = aterrizado
 */
export type MissionState = "WAIT" | "DESC" | "LAND";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface LaunchSite extends GeoPoint {
  nombre: string;
  elevacion_m: number;
}

export interface MissionSpecGroup {
  grupo: string;
  items: [string, string][];
}

export interface MissionInfo {
  nombre: string;
  objetivo: string;
  fecha_lanzamiento: string;
  altitud_objetivo_m: number;
  componentes: string[];
  sitio_lanzamiento?: LaunchSite;
  especificaciones?: MissionSpecGroup[];
}

export interface ComponentLocalGeometry {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

export interface ComponentSpec {
  id: string;
  nombre: string;
  descripcion: string;
  specs: Record<string, string>;
  mesh_name: string;
  categoria?: string;
  modelo?: string;
  parent?: string;
  stack?: number;
  color?: string;
  local?: ComponentLocalGeometry;
}

export interface GpsReading {
  lat: number;
  lng: number;
  alt_m: number;
  satelites: number;
}

export interface Vector3Reading {
  x: number;
  y: number;
  z: number;
}

export interface TelemetryReading {
  // ── Campos TR-02 obligatorios ───────────────────────────────────────────
  /** 1. TEAM_ID: identificador único del equipo (entero 4 dígitos). */
  team_id: number;
  /** 2. MISSION_TIME: tiempo transcurrido desde encendido, formato HH:MM:SS. */
  mission_time: string;
  /** 3. PACKET_COUNT: contador incremental de paquetes transmitidos. */
  packet_count: number;
  /** 4. ALTITUDE: altitud relativa en metros (1 decimal). */
  altitud_m: number;
  /** 5. TEMPERATURE: temperatura interna del CanSat en °C (1 decimal). */
  temperatura_c: number;
  /** 6. VOLTAGE: voltaje de la batería en V (2 decimales). */
  voltage_v: number;
  /** 7-9. ACCEL_X/Y/Z: aceleración IMU en g (2 decimales). */
  acelerometro: Vector3Reading;
  /** 10. STATE: estado de misión de exactamente 4 chars (WAIT/DESC/LAND). */
  state: MissionState;

  // ── Campos complementarios (no TR-02, pero ya existentes) ───────────────
  timestamp: string;
  temperatura_mpu_c: number;
  presion_hpa: number;
  gps: GpsReading;
  giroscopio: Vector3Reading;
  magnetometro: Vector3Reading;
  rssi_dbm: number;
  /** Fase de vuelo interna (español) — se mapea a state al emitir TR-02. */
  estado: FlightPhase;
  velocidad_vertical_ms?: number;
}

export interface LandingEvent {
  aterrizo: boolean;
  timestamp: string | null;
  coordenadas: GeoPoint | null;
  metodo_deteccion: string;
  ultimo_paquete?: string | null;
  precision_m?: number;
}
