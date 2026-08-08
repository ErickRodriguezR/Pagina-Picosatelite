/**
 * Línea de tiempo de fases de misión (build-rules §6.1).
 * Secuencia fija: integración → ascenso → apogeo → recuperación.
 */

export interface TimelinePhase {
  key: string;
  label: string;
  description: string;
}

const PHASES: TimelinePhase[] = [
  {
    key: "integracion",
    label: "Integración",
    description:
      "Ensamblaje de subsistemas, calibración de sensores, verificación de continuidad y prueba de comunicaciones en tierra.",
  },
  {
    key: "ascenso",
    label: "Ascenso",
    description:
      "Lanzamiento asistido por cohete o globo. Adquisición de telemetría a 1 Hz. BMP280 registra presión decreciente, GPS fija posición.",
  },
  {
    key: "apogeo",
    label: "Apogeo",
    description:
      "Detección de apogeo. Activación del sistema de despliegue. Inicio de descenso controlado.",
  },
  {
    key: "recuperacion",
    label: "Recuperación",
    description:
      "Descenso, aterrizaje, localización por coordenadas en tiempo real.",
  },
];

export function MissionTimeline() {
  return (
    <div className="container section section--tight">
      <div className="section-head">
        <p className="eyebrow">Fases de misión</p>
        <h2>Secuencia del lanzamiento</h2>
      </div>

      <ol className="timeline" aria-label="Línea de tiempo de la misión">
        {PHASES.map((phase, index) => (
          <li key={phase.key} className="timeline__step">
            <span className="timeline__num" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="timeline__content">
              <strong className="timeline__label">{phase.label}</strong>
              <span className="timeline__desc">{phase.description}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
