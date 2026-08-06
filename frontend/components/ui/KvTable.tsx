export interface KvTableProps {
  /** Filas como tuplas [clave, valor]. */
  rows: [string, string][];
  className?: string;
}

/**
 * Tabla de especificaciones clave/valor.
 * Renderiza pares en formato th/td con estilo monoespaciado en los valores.
 */
export function KvTable({ rows, className }: KvTableProps) {
  return (
    <table className={`kv${className ? ` ${className}` : ""}`}>
      <tbody>
        {rows.map(([key, value]) => (
          <tr key={key}>
            <th scope="row">{key}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
