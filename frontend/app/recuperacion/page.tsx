import { RecoveryMapLoader, LandingBubble } from "@/components/recovery";

/**
 * Vista 04 — Recuperación
 * Mapa Leaflet + OSM, panel de estado, panel de ruta y burbuja de aterrizaje.
 * Usa componentes de components/recovery/.
 */
export default function RecuperacionPage() {
  return (
    <section aria-labelledby="recoveryTitle">
      <div className="container section section--tight">
        {/* Encabezado */}
        <div className="section-head">
          <p className="eyebrow">Recuperación</p>
          <h2 id="recoveryTitle">Dónde aterrizó y cómo llegar</h2>
          <p className="muted">
            Cuando el pico satélite deja de transmitir o confirma aterrizaje, el
            último punto GPS válido queda fijado aquí junto con la ruta desde tu
            ubicación. Mapa con OpenStreetMap y ruteo con OSRM.
          </p>
        </div>

        {/* Grid: mapa + sidebar */}
        <div className="recovery-grid">
          {/* Mapa */}
          <RecoveryMapLoader
            target={null}
            launchSite={LAUNCH_SITE}
          />

          {/* Sidebar */}
          <aside className="grid" style={{ gap: "var(--space-4)" }}>
            {/* Panel de estado */}
            <div className="panel panel--corner" aria-live="polite">
              <div className="panel__title">
                <h3 style={{ fontSize: "0.98rem" }}>Estado</h3>
                <span className="badge">—</span>
              </div>
              <p className="muted" style={{ marginBottom: "var(--space-3)" }}>
                Consultando estado de la misión…
              </p>
              <table className="kv">
                <tbody>
                  {STATUS_ROWS.map(([key, value]) => (
                    <tr key={key}>
                      <th scope="row">{key}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="btn-row" style={{ marginTop: "var(--space-4)" }}>
                <button className="btn btn--sm" type="button">
                  Copiar coordenadas
                </button>
                <a
                  className="btn btn--sm"
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled="true"
                >
                  Abrir en OSM
                </a>
              </div>
            </div>

            {/* Panel de ruta */}
            <div className="panel" aria-labelledby="routeTitle">
              <div className="panel__title">
                <h3 id="routeTitle" style={{ fontSize: "0.98rem" }}>Ruta hacia el punto</h3>
              </div>
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                Necesitamos tu ubicación para trazar la ruta. El navegador te
                pedirá permiso; si prefieres, captura las coordenadas de tu punto
                de partida a mano.
              </p>
              <div className="btn-row">
                <button className="btn btn--green btn--sm" type="button">
                  <GeolocateIcon />
                  Usar mi ubicación
                </button>
                <button
                  className="btn btn--sm"
                  type="button"
                  aria-expanded="false"
                  aria-controls="manualOriginBox"
                >
                  Capturar a mano
                </button>
              </div>

              {/* Entrada manual de origen */}
              <div id="manualOriginBox" style={{ display: "none", marginTop: "var(--space-3)" }}>
                <div className="field">
                  <label htmlFor="manualCoords">Origen (lat, lng)</label>
                  <input
                    type="text"
                    id="manualCoords"
                    inputMode="decimal"
                    placeholder="19.7043, -98.4512"
                    aria-describedby="manualCoordsHint"
                  />
                  <span className="mono muted" id="manualCoordsHint" style={{ fontSize: "0.7rem" }}>
                    Formato decimal, separado por coma.
                  </span>
                </div>
                <button className="btn btn--sm" type="button" style={{ marginTop: "var(--space-2)" }}>
                  Trazar ruta
                </button>
              </div>

              <p className="mono" role="status" style={{ fontSize: "0.76rem", margin: "var(--space-3) 0 0", color: "var(--text-muted)" }} />

              {/* Resumen de ruta (oculto hasta que se calcule) */}
              <div style={{ display: "none", marginTop: "var(--space-3)" }}>
                <div className="grid grid--2" style={{ gap: "var(--space-3)" }}>
                  <div className="stat stat--green">
                    <span className="stat__label">Distancia</span>
                    <span className="stat__value">—</span>
                  </div>
                  <div className="stat">
                    <span className="stat__label">Tiempo estimado</span>
                    <span className="stat__value">—</span>
                  </div>
                </div>
                <ol className="route-steps" />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Burbuja de aterrizaje exitoso */}
      <LandingBubble landed={false} detail="—" />
    </section>
  );
}

/* ─── Datos estáticos (se moverán a lib/api/mock) ─── */

const LAUNCH_SITE = { lat: 19.475624, lng: -102.073010 };

const STATUS_ROWS: [string, string][] = [
  ["Coordenadas", "—"],
  ["Estado de misión", "Sin datos"],
  ["Hora de aterrizaje", "—"],
  ["Último paquete", "—"],
  ["Altitud del punto", "—"],
  ["Precisión estimada", "—"],
  ["Distancia al sitio", "—"],
  ["Detección", "—"],
];

/* ─── Íconos ─── */

function GeolocateIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}
