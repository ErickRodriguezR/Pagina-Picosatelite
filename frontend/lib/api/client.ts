import missionMock from "./mock/mission.mock.json";
import componentsMock from "./mock/components.mock.json";
import telemetryMock from "./mock/telemetry.mock.json";
import landingMock from "./mock/landing.mock.json";
import type {
  ComponentSpec,
  LandingEvent,
  MissionInfo,
  TelemetryReading,
} from "./types";

export interface TelemetryRange {
  from?: string;
  to?: string;
}

/**
 * La aplicación utiliza mocks locales hasta que exista la estación de tierra.
 * Para activar la futura API basta con definir NEXT_PUBLIC_USE_MOCK=false y
 * NEXT_PUBLIC_API_BASE; ninguna vista necesita cambiar.
 */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

const MOCK_MISSION = missionMock as MissionInfo;
const MOCK_COMPONENTS: ComponentSpec[] = componentsMock.map((component) => {
  const specs: Record<string, string> = {};
  Object.entries(component.specs).forEach(([key, value]) => {
    if (typeof value === "string") specs[key] = value;
  });

  return {
    id: component.id,
    nombre: component.nombre,
    descripcion: component.descripcion,
    specs,
    mesh_name: component.mesh_name,
    categoria: component.categoria,
    modelo: component.modelo,
    stack: component.stack,
    color: component.color,
  };
});
const MOCK_TELEMETRY = telemetryMock as TelemetryReading[];
const MOCK_LANDING = landingMock as LandingEvent;

function clone<T>(value: T): T {
  return structuredClone(value);
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`La estación de tierra respondió ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function filterTelemetry(readings: TelemetryReading[], range: TelemetryRange): TelemetryReading[] {
  if (!range.from && !range.to) return readings;

  const fromMs = range.from ? Date.parse(range.from) : -Infinity;
  const toMs = range.to ? Date.parse(range.to) : Infinity;

  return readings.filter((reading) => {
    const timestamp = Date.parse(reading.timestamp);
    return timestamp >= fromMs && timestamp <= toMs;
  });
}

export const DataClient = {
  async getMission(): Promise<MissionInfo> {
    if (!USE_MOCK) return apiGet<MissionInfo>("/api/mission");
    return clone(MOCK_MISSION);
  },

  async getComponents(): Promise<ComponentSpec[]> {
    if (!USE_MOCK) return apiGet<ComponentSpec[]>("/api/components");
    return clone(MOCK_COMPONENTS);
  },

  async getTelemetry(range: TelemetryRange = {}): Promise<TelemetryReading[]> {
    if (!USE_MOCK) {
      const query = new URLSearchParams();
      if (range.from) query.set("from", range.from);
      if (range.to) query.set("to", range.to);
      const suffix = query.toString() ? `?${query.toString()}` : "";
      return apiGet<TelemetryReading[]>(`/api/telemetry${suffix}`);
    }

    return filterTelemetry(clone(MOCK_TELEMETRY), range);
  },

  async getLandingEvent(): Promise<LandingEvent> {
    if (!USE_MOCK) return apiGet<LandingEvent>("/api/landing");
    return clone(MOCK_LANDING);
  },
};

export default DataClient;
