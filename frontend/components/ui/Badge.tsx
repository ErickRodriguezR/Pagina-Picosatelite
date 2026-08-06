export type BadgeTone = "default" | "amber" | "green";

export interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}

/**
 * Pequeña píldora de texto monoespaciado para etiquetas y estados.
 */
export function Badge({ children, tone = "default", className }: BadgeProps) {
  const cls = ["badge"];
  if (tone === "amber") cls.push("badge--amber");
  if (tone === "green") cls.push("badge--green");
  if (className) cls.push(className);

  return <span className={cls.join(" ")}>{children}</span>;
}
