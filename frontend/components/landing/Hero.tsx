import Link from "next/link";

/** Datos que el Hero espera recibir (vendrán de lib/api/client.ts). */
export interface HeroProps {
  missionName: string;
  objective: string;
  launchDate: string;
  site: string;
  subsystemCount: number;
  stats: {
    apogeeM: string;
    durationS: string;
    packets: string;
    driftKm: string;
  };
  sheet: [string, string][];
}

export function Hero({ missionName, objective, launchDate, site, subsystemCount, stats, sheet }: HeroProps) {
  return (
    <div className="container hero">
      <div className="hero__grid">
        <div>
          <p className="eyebrow">Pico satélite · Sitio de misión</p>
          <h1 className="hero__title" id="heroTitle">
            Pico satélite <span>{missionName}</span>
          </h1>
          <p className="hero__lead">{objective}</p>

          <div className="hero__meta">
            <span className="badge badge--amber">Lanzamiento {launchDate} UTC</span>
            <span className="badge">{site}</span>
            {/* <span className="badge">{subsystemCount} subsistemas</span> */}
          </div>

          <div className="btn-row">
            <Link className="btn btn--primary" href="/modelo-3d">
              <ModelIcon />
              Explorar modelo 3D
            </Link>
            <Link className="btn" href="/dashboard">
              <ChartIcon />
              Ver telemetría
            </Link>
            {/* <Link className="btn" href="/recuperacion">
              <PinIcon />
              Punto de aterrizaje
            </Link> */}{/* Oculto temporalmente */}
          </div>

          <div className="hero__stats">
            <StatBlock label="Apogeo" value={stats.apogeeM} unit="m" tone="amber" />
            <StatBlock label="Duración de vuelo" value={stats.durationS} />
            <StatBlock label="Paquetes recibidos" value={stats.packets} />
            <StatBlock label="Deriva al aterrizaje" value={stats.driftKm} unit="km" tone="green" />
          </div>
        </div>

        {/* Ficha de misión */}
        <aside className="panel panel--corner" aria-labelledby="missionSheetTitle">
          <div className="panel__title">
            <h3 id="missionSheetTitle">Ficha de misión</h3>
            <span className="badge">origen: mock</span>
          </div>
          <table className="kv">
            <tbody>
              {sheet.map(([key, value]) => (
                <tr key={key}>
                  <th scope="row">{key}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </div>
    </div>
  );
}

/* ─── Sub-componentes privados ─── */

function StatBlock({ label, value, unit, tone }: { label: string; value: string; unit?: string; tone?: string }) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ""}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">
        {value}
        {unit && <small>{unit}</small>}
      </span>
    </div>
  );
}

/* ─── Íconos ─── */

function ModelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5 14.5 5v6L8 14.5 1.5 11V5L8 1.5Z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 5 8 8.5 14.5 5M8 8.5v6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1.5 12.5h13M2.5 10l3-4 3 2.5 4.5-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 14.5S13 9.8 13 6.5A5 5 0 0 0 3 6.5C3 9.8 8 14.5 8 14.5Z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
