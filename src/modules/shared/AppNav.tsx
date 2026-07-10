"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  BarChart3,
  BookOpen,
  User,
  Scale,
  LogOut,
} from "lucide-react";
import { signOut } from "@/src/modules/auth/actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/session", label: "Sesión", icon: Dumbbell },
  { href: "/routines", label: "Rutinas", icon: BookOpen },
  { href: "/analytics", label: "Analítica", icon: BarChart3 },
  { href: "/body-weight", label: "Peso", icon: Scale },
  { href: "/profile", label: "Perfil", icon: User },
];

// Mobile bottom nav — 5 key destinations
const bottomNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/session", label: "Sesión", icon: Dumbbell },
  { href: "/routines", label: "Rutinas", icon: BookOpen },
  { href: "/analytics", label: "Analítica", icon: BarChart3 },
  { href: "/profile", label: "Perfil", icon: User },
];

export function AppNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="sidebar">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-primary)", borderRadius: "var(--radius-md)" }}
          >
            <Dumbbell className="h-5 w-5" style={{ color: "#FFFFFF" }} strokeWidth={2.5} />
          </div>
          <span
            className="sidebar-label"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--color-ink)",
            }}
          >
            Veyra
          </span>
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${active ? "sidebar-item-active" : ""}`}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                <span className="sidebar-label">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Sign out */}
        <form action={signOut}>
          <button type="submit" className="sidebar-item w-full mt-4">
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            <span className="sidebar-label">Salir</span>
          </button>
        </form>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bottom-nav-item"
              style={{
                color: active ? "var(--color-primary)" : "var(--color-ink-dimmed)",
              }}
            >
              <div className="bottom-nav-icon-wrap">
                <Icon className="h-[22px] w-[22px]" />
                {active && <span className="bottom-nav-dot" />}
              </div>
              <span className="bottom-nav-label" style={{ fontWeight: active ? 600 : 400 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
