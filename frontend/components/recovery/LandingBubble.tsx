"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export interface LandingBubbleProps {
  /** Si el aterrizaje fue exitoso (controla visibilidad). */
  landed: boolean;
  /** Detalle a mostrar (ej. coordenadas + timestamp). */
  detail?: string;
  /** Delay antes de mostrar la burbuja (ms). */
  delay?: number;
  /** Auto-dismiss después de este tiempo (ms). 0 = no auto-dismiss. */
  autoDismiss?: number;
}

/**
 * Burbuja verde fija al fondo de la pantalla que aparece cuando
 * el pico satélite confirma aterrizaje exitoso (build-rules §6.4).
 * Usa CSS transitions (no Framer Motion) para la entrada/salida;
 * Framer Motion se añadirá cuando se instale como dependencia.
 */
export function LandingBubble({
  landed,
  detail = "",
  delay = 900,
  autoDismiss = 16000,
}: LandingBubbleProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!landed || dismissed) return;

    // Chequear si ya se descartó en esta sesión de forma asíncrona para
    // evitar una actualización de estado síncrona dentro del efecto.
    const dismissedTimer = setTimeout(() => {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("bubbleDismissed") === "1") {
        setDismissed(true);
      }
    }, 0);

    const showTimer = setTimeout(() => setVisible(true), delay);
    return () => {
      clearTimeout(dismissedTimer);
      clearTimeout(showTimer);
    };
  }, [landed, dismissed, delay]);

  // Auto-dismiss
  useEffect(() => {
    if (!visible || autoDismiss === 0) return;
    const timer = setTimeout(() => {
      setVisible(false);
    }, autoDismiss);
    return () => clearTimeout(timer);
  }, [visible, autoDismiss]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("bubbleDismissed", "1");
    }
  }, []);

  if (!landed || dismissed) return null;

  return (
    <div className={`landing-bubble${visible ? " is-visible" : ""}`} role="status">
      <span className="landing-bubble__icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8.5l3.2 3.2L13 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="landing-bubble__text">
        <strong>Aterrizaje exitoso</strong>
        <span>{detail}</span>
      </span>
      <Link className="btn btn--sm" href="/recuperacion" onClick={handleClose}>
        Ver mapa
      </Link>
      <button
        className="landing-bubble__close"
        type="button"
        aria-label="Cerrar aviso de aterrizaje"
        onClick={handleClose}
      >
        &times;
      </button>
    </div>
  );
}
