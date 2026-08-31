/**
 * useLiveTelemetry.ts
 *
 * Hook React que se suscribe al endpoint SSE del backend Flask
 * y actualiza el estado de `readings` cada vez que llega un paquete nuevo.
 *
 * Características:
 *  - Mantiene las últimas MAX_READINGS lecturas en memoria
 *  - Reconexión automática si el servidor se cae (EventSource lo hace solo)
 *  - Expone `connected` para mostrar el indicador ● EN VIVO
 *  - Carga el historial inicial desde /api/telemetry antes de abrir SSE
 */
"use client";

import { useEffect, useRef, useState } from "react";
import type { TelemetryReading } from "@/lib/api";

const MAX_READINGS = 500; // máximo en memoria (protege RAM en Arduino Uno Q)

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export type LiveStatus = "connecting" | "live" | "reconnecting" | "mock";

export interface UseLiveTelemetryReturn {
  readings: TelemetryReading[];
  status: LiveStatus;
}

export function useLiveTelemetry(): UseLiveTelemetryReturn {
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [status, setStatus] = useState<LiveStatus>(
    USE_MOCK ? "mock" : "connecting"
  );
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (USE_MOCK) {
      // Modo mock: carga los datos estáticos una sola vez
      import("@/lib/api/mock/telemetry.mock.json").then((mod) => {
        setReadings(mod.default as TelemetryReading[]);
        setStatus("mock");
      });
      return;
    }

    let cancelled = false;

    // 1) Carga historial inicial
    fetch(`${API_BASE}/api/telemetry?limit=${MAX_READINGS}`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data: TelemetryReading[]) => {
        if (!cancelled) setReadings(data);
      })
      .catch(() => {
        // historial no disponible aún — no bloqueamos
      });

    // 2) Abre SSE para tiempo real
    function connect() {
      if (cancelled) return;

      const es = new EventSource(`${API_BASE}/api/telemetry/live`);
      esRef.current = es;

      es.addEventListener("connected", () => {
        if (!cancelled) setStatus("live");
      });

      es.addEventListener("telemetry", (ev: MessageEvent) => {
        if (cancelled) return;
        try {
          const reading: TelemetryReading = JSON.parse(ev.data);
          setReadings((prev) => {
            const next = [...prev, reading];
            // Mantiene solo las últimas MAX_READINGS
            return next.length > MAX_READINGS
              ? next.slice(next.length - MAX_READINGS)
              : next;
          });
        } catch {
          // paquete malformado — ignorar
        }
      });

      es.onerror = () => {
        if (cancelled) return;
        setStatus("reconnecting");
        es.close();
        // EventSource reintenta solo, pero cerramos y reabrimos para
        // resetear el estado correctamente
        setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      cancelled = true;
      esRef.current?.close();
    };
  }, []); // solo al montar

  return { readings, status };
}
