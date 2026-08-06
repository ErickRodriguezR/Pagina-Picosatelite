export type StatTone = "default" | "amber" | "green";

export interface StatProps {
  label: string;
  value: string;
  unit?: string;
  tone?: StatTone;
  className?: string;
}

/**
 * Bloque de dato/estadística con label monoespaciado y valor grande.
 * Usado en KPIs, hero stats y paneles de resumen.
 */
export function Stat({ label, value, unit, tone = "default", className }: StatProps) {
  const cls = ["stat"];
  if (tone === "amber") cls.push("stat--amber");
  if (tone === "green") cls.push("stat--green");
  if (className) cls.push(className);

  return (
    <div className={cls.join(" ")}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">
        {value}
        {unit && <small>{unit}</small>}
      </span>
    </div>
  );
}
