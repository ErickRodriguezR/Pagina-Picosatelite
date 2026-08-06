"use client";

import { useRef, useEffect, useState } from "react";

export interface MapPoint {
  lat: number;
  lng: number;
}

export interface RecoveryMapProps {
  /** Punto de aterrizaje / último fix. */
  target: MapPoint | null;
  /** Sitio de lanzamiento. */
  launchSite?: MapPoint | null;
  /** Radio de incertidumbre en metros. */
  precisionM?: number;
  /** Trayectoria GPS del vuelo como array de [lat, lng]. */
  trajectory?: [number, number][];
}

/**
 * Mapa Leaflet + OpenStreetMap para la vista de recuperación.
 * Se carga como componente cliente (ssr:false via wrapper).
 * Leaflet se importa dinámicamente al montar el componente.
 */
export function RecoveryMap({ target, launchSite, precisionM, trajectory }: RecoveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        // Cargar Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        // Cargar Leaflet JS
        const L = await import("leaflet").catch(() => null);

        if (cancelled) return;

        if (!L || !containerRef.current) {
          setError(
            "No se pudo cargar el mapa (Leaflet no respondió). " +
            "Las coordenadas del punto de aterrizaje siguen visibles y el enlace \"Abrir en OSM\" funciona."
          );
          setLoading(false);
          return;
        }

        const center = target ?? launchSite ?? { lat: 19.4756, lng: -102.073 };
        const map = L.map(containerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
        }).setView([center.lat, center.lng], 15);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        L.control.scale({ imperial: false }).addTo(map);

        // Trayectoria
        if (trajectory && trajectory.length > 1) {
          L.polyline(trajectory, {
            color: "#FFB020",
            weight: 2,
            opacity: 0.75,
            dashArray: "5 4",
          }).addTo(map);
        }

        // Sitio de lanzamiento
        if (launchSite) {
          L.circleMarker([launchSite.lat, launchSite.lng], {
            radius: 8,
            color: "#FFB020",
            fillColor: "#FFB020",
            fillOpacity: 0.7,
          })
            .addTo(map)
            .bindPopup("Sitio de lanzamiento");
        }

        // Punto de aterrizaje
        if (target) {
          L.circleMarker([target.lat, target.lng], {
            radius: 10,
            color: "#35D07F",
            fillColor: "#35D07F",
            fillOpacity: 0.8,
          })
            .addTo(map)
            .bindPopup("Punto de aterrizaje")
            .openPopup();

          if (precisionM) {
            L.circle([target.lat, target.lng], {
              radius: precisionM,
              color: "#35D07F",
              weight: 1,
              fillColor: "#35D07F",
              fillOpacity: 0.12,
            }).addTo(map);
          }

          if (launchSite) {
            map.fitBounds(
              L.latLngBounds(
                [launchSite.lat, launchSite.lng],
                [target.lat, target.lng]
              ).pad(0.25)
            );
          }
        }

        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Error al inicializar el mapa.");
          setLoading(false);
        }
      }
    }

    initMap();
    return () => { cancelled = true; };
  }, [target, launchSite, precisionM, trajectory]);

  if (error) {
    return (
      <div className="panel panel--flush">
        <div className="notice notice--error" style={{ margin: "var(--space-4)" }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel panel--flush">
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeContent: "center",
            zIndex: 2,
            background: "var(--bg-panel-2)",
          }}
        >
          <div className="spinner" aria-hidden="true" />
          <p className="mono muted" style={{ margin: "var(--space-2) 0 0", fontSize: "0.78rem" }}>
            Cargando mapa…
          </p>
        </div>
      )}
      <div
        ref={containerRef}
        id="map"
        role="application"
        aria-label="Mapa del punto de aterrizaje y ruta de recuperación"
      />
    </div>
  );
}
