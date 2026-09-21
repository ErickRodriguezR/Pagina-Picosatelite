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
        <path className="battery-rocket__bolt" d="M18.8 2.5 7.1 17.3h7.2L12.6 29.5l12.3-16.1h-7.6l1.5-10.9Z" />
      </svg>
      <span className="battery-rocket__value mono">{value}%</span>
    </span>
  );
}
