import Link from "next/link";
import { forwardRef } from "react";

export type ButtonVariant = "default" | "primary" | "green";
export type ButtonSize = "default" | "sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

export interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

function buildClassName(variant: ButtonVariant = "default", size: ButtonSize = "default", block = false, extra?: string) {
  const parts = ["btn"];
  if (variant === "primary") parts.push("btn--primary");
  if (variant === "green") parts.push("btn--green");
  if (size === "sm") parts.push("btn--sm");
  if (block) parts.push("btn--block");
  if (extra) parts.push(extra);
  return parts.join(" ");
}

/**
 * Botón reutilizable con variantes de estilo del design system.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant, size, block, className, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={buildClassName(variant, size, block, className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

/**
 * Enlace con apariencia de botón (usa next/link).
 */
export function ButtonLink({ href, variant, size, block, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={buildClassName(variant, size, block, className)}
      {...props}
    >
      {children}
    </Link>
  );
}
