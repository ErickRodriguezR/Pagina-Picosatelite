"use client";

import { useState, useCallback } from "react";

export interface ExportButtonProps {
  /** Callback que ejecuta la exportación. Debe retornar una promesa. */
  onExport: () => Promise<void>;
  /** Si no hay datos para exportar. */
  disabled?: boolean;
}

/**
 * Botón de descarga a Excel (SheetJS).
 * Muestra estado de carga mientras se genera el archivo.
 */
export function ExportButton({ onExport, disabled = false }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState("");

  const handleClick = useCallback(async () => {
    if (exporting || disabled) return;
    setExporting(true);
    setStatus("Generando archivo…");
    try {
      await onExport();
      setStatus("Listo: archivo descargado.");
    } catch {
      setStatus("Error al exportar. Intenta de nuevo.");
    } finally {
      setExporting(false);
    }
  }, [exporting, disabled, onExport]);

  return (
    <>
      <button
        className="btn btn--primary btn--sm"
        type="button"
        onClick={handleClick}
        disabled={disabled || exporting}
      >
        <DownloadIcon />
        {exporting ? "Exportando…" : "Descargar Excel"}
      </button>
      {status && (
        <p
          className="mono muted"
          role="status"
          style={{ fontSize: "0.76rem", margin: "var(--space-3) 0 0" }}
        >
          {status}
        </p>
      )}
    </>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5v8m0 0L5 6.5m3 3 3-3M2.5 11.5v2h11v-2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
