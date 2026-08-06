export type NoticeTone = "default" | "error" | "green";

export interface NoticeProps {
  children: React.ReactNode;
  tone?: NoticeTone;
  /** Ícono o elemento decorativo a la izquierda. */
  icon?: React.ReactNode;
  role?: string;
}

/**
 * Aviso/nota con borde discontinuo y color según gravedad.
 * Usado para mensajes informativos, errores y confirmaciones.
 */
export function Notice({ children, tone = "default", icon, role = "note" }: NoticeProps) {
  const cls = ["notice"];
  if (tone === "error") cls.push("notice--error");
  if (tone === "green") cls.push("notice--green");

  return (
    <div className={cls.join(" ")} role={role}>
      {icon}
      {children}
    </div>
  );
}
