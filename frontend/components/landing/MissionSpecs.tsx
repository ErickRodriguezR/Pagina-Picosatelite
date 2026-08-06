/** Grupo de especificaciones de un subsistema. */
export interface SpecGroup {
  title: string;
  items: [string, string][];
}

export interface MissionSpecsProps {
  groups: SpecGroup[];
}

/**
 * Grid de tarjetas de especificaciones técnicas del pico satélite.
 * Cada tarjeta muestra un subsistema con sus valores clave/valor.
 */
export function MissionSpecs({ groups }: MissionSpecsProps) {
  return (
    <div className="container section section--tight">
      <div className="section-head">
        <p className="eyebrow">Especificaciones</p>
        <h2>Qué lleva a bordo</h2>
        <p className="muted">
          Subsistemas del pico satélite. Los valores marcados como placeholder se
          confirman contra el datasheet definitivo de cada módulo antes del vuelo.
        </p>
      </div>
      <div className="grid grid--3">
        {groups.map((group) => (
          <SpecCard key={group.title} title={group.title} items={group.items} />
        ))}
      </div>
    </div>
  );
}

function SpecCard({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <article className="panel panel--corner spec-card">
      <h3>
        <span className="spec-card__icon" aria-hidden="true">◈</span>
        {title}
      </h3>
      <ul>
        {items.map(([key, value]) => (
          <li key={key}>
            {key}: <b>{value}</b>
          </li>
        ))}
      </ul>
    </article>
  );
}
