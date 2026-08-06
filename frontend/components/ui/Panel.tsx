export interface PanelProps {
  children: React.ReactNode;
  /** Muestra marcas de esquina tipo plano técnico. */
  corner?: boolean;
  /** Sin padding, overflow hidden (para tablas/mapas). */
  flush?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** aria-labelledby para accesibilidad. */
  ariaLabelledBy?: string;
  /** aria-live para regiones dinámicas. */
  ariaLive?: "polite" | "assertive" | "off";
  /** Renderizar como aside en vez de div. */
  as?: "div" | "aside" | "article";
}

/**
 * Superficie elevada con borde de plano técnico.
 * Base de tarjetas, paneles laterales y contenedores flush.
 */
export function Panel({
  children,
  corner = false,
  flush = false,
  className,
  style,
  ariaLabelledBy,
  ariaLive,
  as: Tag = "div",
}: PanelProps) {
  const cls = ["panel"];
  if (corner) cls.push("panel--corner");
  if (flush) cls.push("panel--flush");
  if (className) cls.push(className);

  return (
    <Tag
      className={cls.join(" ")}
      style={style}
      aria-labelledby={ariaLabelledBy}
      aria-live={ariaLive}
    >
      {children}
    </Tag>
  );
}

export interface PanelTitleProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Encabezado de panel con título a la izquierda y acción opcional a la derecha.
 */
export function PanelTitle({ children, action }: PanelTitleProps) {
  return (
    <div className="panel__title">
      {children}
      {action}
    </div>
  );
}
