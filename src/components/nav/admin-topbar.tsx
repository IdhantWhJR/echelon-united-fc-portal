"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/icons";
import { clsx } from "clsx";
import { AdminMobileNav } from "@/components/nav/admin-mobile-nav";

export function AdminTopbar({ name, role, unreadCount = 0 }: { name: string; role: string; unreadCount?: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-ink/90 px-4 py-3.5 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <AdminMobileNav />
        <span className="font-display text-sm font-bold uppercase tracking-wide text-gold lg:hidden">
          EUFC Staff
        </span>
      </div>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <Link
          href="/admin/my-notifications"
          aria-label="Notifications"
          className="relative rounded-full border border-line p-2 text-paper-dim transition-colors hover:border-gold-deep hover:text-gold"
        >
          <Icon name="bell" width={18} height={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-ink">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Account menu for ${name}`}
            className="flex min-h-[40px] items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-sm text-paper transition-colors hover:border-gold-deep"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-700 font-display text-xs font-bold text-gold">
              {initials}
            </span>
            <span className="hidden font-medium sm:inline">{name.split(" ")[0]}</span>
            <Icon name="chevronDown" width={14} height={14} className="text-paper-faint" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className={clsx(
                "absolute right-0 top-full mt-2 w-52 animate-rise-in rounded-md border border-line bg-ink-800 py-1 shadow-pop"
              )}
            >
              <div className="border-b border-line px-3.5 py-2.5">
                <p className="text-sm font-medium text-paper">{name}</p>
                <p className="text-xs capitalize text-paper-faint">{role.toLowerCase()}</p>
              </div>
              <Link
                href="/dashboard"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="block min-h-[40px] px-3.5 py-2 text-sm leading-6 text-paper-dim hover:bg-ink-700 hover:text-paper"
              >
                Player view
              </Link>
              <button
                role="menuitem"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex min-h-[40px] w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-signal-danger hover:bg-ink-700"
              >
                <Icon name="logout" width={15} height={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
