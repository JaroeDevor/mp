"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/prospects", label: "Prospectos", icon: "👥" },
    { href: "/search", label: "Buscar", icon: "🔍" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>🏍️ MotoProspect</h1>
        <span>Prospección Automática</span>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname === link.href ? "active" : ""}`}
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        {session?.user && (
          <>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
              {session.user.name}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn btn-ghost btn-sm"
              style={{ width: "100%" }}
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
