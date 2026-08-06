export interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Etiqueta tipo "eyebrow" para encabezados de sección.
 * Texto monoespaciado en mayúsculas con raya decorativa a la izquierda.
 */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p className={`eyebrow${className ? ` ${className}` : ""}`}>
      {children}
    </p>
  );
}
