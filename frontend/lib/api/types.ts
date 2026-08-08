export type FlightPhase =
  | "pre-lanzamiento"
  | "ascenso"
  | "descenso"
  | "aterrizado";

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
  timestamp: string;
  altitud_m: number;
  temperatura_c: number;
  temperatura_mpu_c: number;
  presion_hpa: number;
  gps: GpsReading;
  acelerometro: Vector3Reading;
  giroscopio: Vector3Reading;
  magnetometro: Vector3Reading;
  rssi_dbm: number;
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
