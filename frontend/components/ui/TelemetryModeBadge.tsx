type TelemetryMode = 0 | 1;

type TelemetryModeBadgeProps = {
  mode?: TelemetryMode;
};

export function TelemetryModeBadge({ mode = 0 }: TelemetryModeBadgeProps) {
  const isRealtime = mode === 1;
  const label = isRealtime ? "TIEMPO REAL" : "SIMULACIÓN";

  return (
    <span
      className={`telemetry-mode telemetry-mode--${isRealtime ? "realtime" : "simulation"}`}
      role="status"
      aria-label={`Modo de telemetría: ${mode}, ${label}`}
      title={`Modo de telemetría: ${mode} · ${label}`}
    >
      <span className="telemetry-mode__mark" aria-hidden="true">
        {isRealtime ? "●" : "◆"}
      </span>
      <span className="telemetry-mode__value mono">{mode}</span>
      <span>{label}</span>
    </span>
  );
}
