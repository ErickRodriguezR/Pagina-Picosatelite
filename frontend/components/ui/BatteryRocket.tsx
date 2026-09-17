type BatteryRocketProps = {
  percentage?: number;
};

export function BatteryRocket({ percentage = 86 }: BatteryRocketProps) {
  const value = Math.min(100, Math.max(0, Math.round(percentage)));
  const state = value <= 20 ? "critical" : value <= 50 ? "warning" : "healthy";

  return (
    <span
      className={`battery-rocket battery-rocket--${state}`}
      role="img"
      aria-label={`Batería del satélite: ${value}%`}
      title={`Batería: ${value}%`}
    >
      <svg className="battery-rocket__icon" viewBox="0 0 32 32" aria-hidden="true">
        <path
          className="battery-rocket__flame"
          d="M13.4 23.4 11 28l4.8-2.1L18 29l1.1-5.1"
        />
        <path
          className="battery-rocket__body"
          d="m16 3.5 3.8 3.2c2.8 2.5 3.4 7.2 1.4 10.5l-3.1 5.2h-4.2l-3.1-5.2c-2-3.3-1.4-8 1.4-10.5L16 3.5Z"
        />
        <path className="battery-rocket__fin" d="m11.5 17.2-4.1 2.2.8-5.2 3.5-1.7M20.5 17.2l4.1 2.2-.8-5.2-3.5-1.7" />
        <circle className="battery-rocket__window" cx="16" cy="11.8" r="2.1" />
      </svg>
      <span className="battery-rocket__value mono">{value}%</span>
    </span>
  );
}
