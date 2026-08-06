"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Inicio", num: "01" },
  { href: "/modelo-3d", label: "Modelo 3D", num: "02" },
  { href: "/dashboard", label: "Telemetría", num: "03" },
  { href: "/recuperacion", label: "Recuperación", num: "04" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Vistas del sitio">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            className={`nav__link${isActive ? " nav__link--active" : ""}`}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="nav__num">{link.num}</span> {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
