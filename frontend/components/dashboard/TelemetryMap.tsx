"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { TelemetryReading } from "@/lib/api";
import { formatCoordinate, formatDistance } from "@/lib/utils/format";
import { haversineDistance } from "@/lib/utils/geo";

export interface TelemetryMapProps {
  readings: TelemetryReading[];
  launchSite?: { lat: number; lng: number } | null;
  className?: string;
}

const DEFAULT_CENTER = { lat: 19.475624, lng: -102.07301 };

export function TelemetryMap({ readings, launchSite = DEFAULT_CENTER, className }: TelemetryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const polylineRef = useRef<import("leaflet").Polyline | null>(null);
  const satMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const launchMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const hasInitiallyFittedRef = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtrar lecturas con coordenadas GPS válidas
  const validReadings = useMemo(() => {
    return readings.filter(
      (r) =>
        r.gps &&
        typeof r.gps.lat === "number" &&
        typeof r.gps.lng === "number" &&
        (r.gps.lat !== 0 || r.gps.lng !== 0) &&
        !Number.isNaN(r.gps.lat) &&
        !Number.isNaN(r.gps.lng)
    );
  }, [readings]);

  const lastValid = validReadings.length > 0 ? validReadings[validReadings.length - 1] : null;
  const currentGps = lastValid?.gps ?? null;
  const lastReading = readings.length > 0 ? readings[readings.length - 1] : null;

  // Array de coordenadas para la polilínea [lat, lng]
  const trajectoryCoords = useMemo<[number, number][]>(() => {
    return validReadings.map((r) => [r.gps.lat, r.gps.lng]);
  }, [validReadings]);

  // Distancia calculada respecto al despegue
  const distFromLaunch = useMemo(() => {
    if (!currentGps) return null;
    const origin = launchSite ?? (validReadings[0]?.gps ? { lat: validReadings[0].gps.lat, lng: validReadings[0].gps.lng } : null);
    if (!origin) return null;
    return haversineDistance(origin, currentGps);
  }, [currentGps, launchSite, validReadings]);

  // Inicialización de Leaflet
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Inyectar CSS de Leaflet si no existe
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        const L = await import("leaflet");
        if (cancelled) return;
        leafletRef.current = L;

        if (!containerRef.current) return;

        // Limpiar mapa previo si existía en el contenedor
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const centerPoint = currentGps
          ? [currentGps.lat, currentGps.lng]
          : launchSite
          ? [launchSite.lat, launchSite.lng]
          : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

        const map = L.map(containerRef.current, {
          center: centerPoint as [number, number],
          zoom: 16,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // Capa de mosaicos OpenStreetMap
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        }).addTo(map);

        L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);

        // Icono para sitio de lanzamiento
        const launchIcon = L.divIcon({
          className: "custom-launch-icon",
          html: `<div class="map-marker map-marker--launch" title="Sitio de despegue">🚀</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          popupAnchor: [0, -13],
        });

        // Icono para satélite
        const satIcon = L.divIcon({
          className: "custom-sat-icon",
          html: `<div class="map-marker map-marker--sat" title="Pico Satélite">🛰️</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });

        // Marcador de despegue
        if (launchSite) {
          launchMarkerRef.current = L.marker([launchSite.lat, launchSite.lng], { icon: launchIcon })
            .addTo(map)
            .bindPopup(
              `<div style="font-family: inherit; font-size: 0.82rem; padding: 2px;">
                <strong style="color: #FFB020;">🚀 Sitio de Despegue</strong>
                <div style="font-family: var(--font-mono); font-size: 0.75rem; margin-top: 4px; color: #8B9AB3;">
                  Lat: ${launchSite.lat.toFixed(6)}°<br/>Lng: ${launchSite.lng.toFixed(6)}°
                </div>
              </div>`
            );
        }

        // Línea de trayectoria
        polylineRef.current = L.polyline(trajectoryCoords, {
          color: "#FFB020",
          weight: 3,
          opacity: 0.85,
          dashArray: "6 4",
        }).addTo(map);

        // Marcador del satélite
        if (currentGps) {
          satMarkerRef.current = L.marker([currentGps.lat, currentGps.lng], { icon: satIcon })
            .addTo(map)
            .bindPopup(buildPopupContent(currentGps, lastReading?.state, lastReading?.mission_time));
        }

        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (err) {
        if (!cancelled) {
          console.error("Error al inicializar Leaflet en TelemetryMap:", err);
          setError("No se pudo inicializar el mapa Leaflet.");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar marcadores y ruta cuando cambien los datos de telemetría
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || !mapReady) return;

    // Actualizar trayectoria
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(trajectoryCoords);
    }

    // Actualizar o crear marcador de satélite
    if (currentGps) {
      const latLng: [number, number] = [currentGps.lat, currentGps.lng];
      const popupHtml = buildPopupContent(currentGps, lastReading?.state, lastReading?.mission_time);

      if (satMarkerRef.current) {
        satMarkerRef.current.setLatLng(latLng);
        satMarkerRef.current.setPopupContent(popupHtml);
      } else {
        const satIcon = L.divIcon({
          className: "custom-sat-icon",
          html: `<div class="map-marker map-marker--sat" title="Pico Satélite">🛰️</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });
        satMarkerRef.current = L.marker(latLng, { icon: satIcon }).addTo(map).bindPopup(popupHtml);
      }

      // Ajuste de vista inicial si hay trayectoria
      if (!hasInitiallyFittedRef.current && trajectoryCoords.length > 1) {
        const bounds = L.latLngBounds(trajectoryCoords);
        if (launchSite) bounds.extend([launchSite.lat, launchSite.lng]);
        map.fitBounds(bounds.pad(0.2));
        hasInitiallyFittedRef.current = true;
      } else if (autoFollow) {
        map.panTo(latLng, { animate: true });
      }
    }
  }, [currentGps, trajectoryCoords, mapReady, autoFollow, lastReading?.state, lastReading?.mission_time, launchSite]);

  // Manejadores de vista del mapa
  const handleCenterSat = useCallback(() => {
    if (!mapInstanceRef.current || !currentGps) return;
    mapInstanceRef.current.setView([currentGps.lat, currentGps.lng], 17, { animate: true });
  }, [currentGps]);

  const handleFitTrajectory = useCallback(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    if (trajectoryCoords.length > 0) {
      const bounds = L.latLngBounds(trajectoryCoords);
      if (launchSite) bounds.extend([launchSite.lat, launchSite.lng]);
      map.fitBounds(bounds.pad(0.2), { animate: true });
    } else if (launchSite) {
      map.setView([launchSite.lat, launchSite.lng], 16, { animate: true });
    }
  }, [trajectoryCoords, launchSite]);

  const osmUrl = currentGps
    ? `https://www.openstreetmap.org/?mlat=${currentGps.lat}&mlon=${currentGps.lng}#map=17/${currentGps.lat}/${currentGps.lng}`
    : "#";

  return (
    <div className={`panel panel--corner ${className ?? ""}`} style={{ overflow: "hidden" }}>
      {/* ── Encabezado del Mapa ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          marginBottom: "var(--space-3)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <h3 style={{ fontSize: "1.05rem", margin: 0 }}>Mapa de vuelo en tiempo real (GPS)</h3>
            <span
              className={`badge ${currentGps ? "badge--green" : "badge--amber"}`}
              style={{ fontSize: "0.72rem" }}
            >
              {currentGps
                ? `${currentGps.satelites} satélites · FIX`
                : "Esperando señal GPS"}
            </span>
          </div>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
            Receptor ATGM336H · Trayectoria proyectada sobre OpenStreetMap
          </p>
        </div>

        {/* Acciones del mapa */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`btn btn--sm ${autoFollow ? "btn--green" : ""}`}
            onClick={() => setAutoFollow((prev) => !prev)}
            title="Activa o desactiva el seguimiento automático de la posición del satélite"
          >
            {autoFollow ? "Seguimiento: ACTIVO" : "Seguimiento: MANUAL"}
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={handleCenterSat}
            disabled={!currentGps}
          >
            Centrar satélite
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={handleFitTrajectory}
            disabled={trajectoryCoords.length === 0}
          >
            Ajustar ruta
          </button>
          {currentGps && (
            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--sm"
              title="Abrir coordenadas en OpenStreetMap externo"
            >
              Abrir en OSM ↗
            </a>
          )}
        </div>
      </div>

      {/* ── Barra de Telemetría GPS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "var(--space-2)",
          padding: "var(--space-2) var(--space-3)",
          background: "var(--bg-panel-2)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--line-blueprint)",
          marginBottom: "var(--space-3)",
          fontSize: "0.8rem",
        }}
      >
        <div>
          <span className="muted" style={{ display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Latitud</span>
          <span className="mono" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            {formatCoordinate(currentGps?.lat)}°
          </span>
        </div>
        <div>
          <span className="muted" style={{ display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Longitud</span>
          <span className="mono" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            {formatCoordinate(currentGps?.lng)}°
          </span>
        </div>
        <div>
          <span className="muted" style={{ display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Altitud GPS</span>
          <span className="mono" style={{ color: "var(--accent-amber)", fontWeight: 600 }}>
            {currentGps?.alt_m !== undefined ? `${currentGps.alt_m.toFixed(1)} m` : "—"}
          </span>
        </div>
        <div>
          <span className="muted" style={{ display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Dist. Despegue</span>
          <span className="mono" style={{ color: "var(--accent-green)", fontWeight: 600 }}>
            {distFromLaunch !== null ? formatDistance(distFromLaunch) : "—"}
          </span>
        </div>
        <div>
          <span className="muted" style={{ display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Puntos trazados</span>
          <span className="mono" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            {trajectoryCoords.length}
          </span>
        </div>
      </div>

      {/* ── Contenedor del Mapa Leaflet ── */}
      <div style={{ position: "relative", width: "100%", borderRadius: "var(--radius)" }}>
        {error && (
          <div
            className="notice notice--error"
            style={{ margin: 0, padding: "var(--space-3)" }}
          >
            <p>{error}</p>
          </div>
        )}

        {!mapReady && !error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "grid",
              placeContent: "center",
              background: "var(--bg-panel-2)",
              borderRadius: "var(--radius)",
              minHeight: "380px",
            }}
          >
            <div className="spinner" aria-hidden="true" />
            <p className="mono muted" style={{ margin: "var(--space-2) 0 0", fontSize: "0.8rem" }}>
              Cargando mapa de satélite…
            </p>
          </div>
        )}

        <div
          ref={containerRef}
          className="telemetry-map-canvas"
          role="application"
          aria-label="Mapa de telemetría GPS del pico satélite"
        />
      </div>
    </div>
  );
}

function buildPopupContent(
  gps: { lat: number; lng: number; alt_m: number; satelites: number },
  state?: string,
  missionTime?: string
): string {
  return `
    <div style="font-family: inherit; font-size: 0.85rem; padding: 2px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
        <strong style="color: #35D07F; font-size: 0.92rem;">🛰️ Pico Satélite</strong>
        ${state ? `<span style="background: rgba(53,208,127,0.15); color: #35D07F; padding: 1px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">${state}</span>` : ""}
      </div>
      <div style="font-family: var(--font-mono, monospace); font-size: 0.78rem; display: grid; gap: 3px; color: #E7ECF2;">
        <div><span style="color: #8B9AB3;">Lat:</span> ${gps.lat.toFixed(6)}°</div>
        <div><span style="color: #8B9AB3;">Lng:</span> ${gps.lng.toFixed(6)}°</div>
        <div><span style="color: #8B9AB3;">Alt GPS:</span> <span style="color: #FFB020;">${gps.alt_m.toFixed(1)} m</span></div>
        <div><span style="color: #8B9AB3;">Satélites:</span> ${gps.satelites}</div>
        ${missionTime ? `<div><span style="color: #8B9AB3;">T. Misión:</span> ${missionTime}</div>` : ""}
      </div>
    </div>
  `;
}
