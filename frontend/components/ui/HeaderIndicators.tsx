"use client";

import { useLiveTelemetry } from "@/lib/hooks/useLiveTelemetry";
import { BatteryRocket } from "./BatteryRocket";
import { TelemetryModeBadge } from "./TelemetryModeBadge";

export function HeaderIndicators() {
  const { readings, status } = useLiveTelemetry();
  const last = readings.length > 0 ? readings[readings.length - 1] : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <TelemetryModeBadge mode={status === "mock" ? 0 : 1} />
      {last && <BatteryRocket percentage={(last.voltage_v / 7.4) * 100} />}
    </div>
  );
}
