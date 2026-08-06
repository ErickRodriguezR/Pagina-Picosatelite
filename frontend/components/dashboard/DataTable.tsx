"use client";

import { useState, useMemo, useCallback } from "react";

export interface DataTableColumn {
  key: string;
  label: string;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  /** Filas como arreglo de objetos con los keys de las columnas. */
  rows: Record<string, string | number>[];
  /** Filas por página. */
  pageSize?: number;
}

/**
 * Tabla de datos crudos paginada.
 * Renderiza los encabezados desde `columns` y las filas desde `rows`.
 */
export function DataTable({ columns, rows, pageSize = 25 }: DataTableProps) {
  const [page, setPage] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(rows.length / pageSize)),
    [rows.length, pageSize]
  );

  const slice = useMemo(
    () => rows.slice(page * pageSize, (page + 1) * pageSize),
    [rows, page, pageSize]
  );

  const goNext = useCallback(() => setPage((p) => Math.min(p + 1, totalPages - 1)), [totalPages]);
  const goPrev = useCallback(() => setPage((p) => Math.max(p - 1, 0)), []);

  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, rows.length);

  return (
    <div className="panel panel--flush" style={{ marginTop: "var(--space-4)" }}>
      <div
        className="panel__title"
        style={{ padding: "var(--space-4) var(--space-4) 0", marginBottom: "var(--space-3)" }}
      >
        <h3 style={{ fontSize: "0.98rem" }}>Datos crudos</h3>
        <span className="badge">{rows.length} registros</span>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key}>{row[col.key] ?? "—"}</td>
                ))}
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  Sin registros en la selección
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span className="pager__info">
          {rows.length > 0
            ? `Página ${page + 1} de ${totalPages} · filas ${start}–${end}`
            : "Sin registros"}
        </span>
        <div className="btn-row">
          <button className="btn btn--sm" type="button" onClick={goPrev} disabled={page === 0}>
            Anterior
          </button>
          <button className="btn btn--sm" type="button" onClick={goNext} disabled={page >= totalPages - 1}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
