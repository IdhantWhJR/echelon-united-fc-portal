"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Icon } from "@/components/icons";
import { ClubMark } from "@/components/brand/club-mark";
import { adminNav } from "@/lib/admin-nav-config";

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        aria-label="Open admin menu"
        onClick={() => setOpen(true)}
        className="rounded-md border border-line p-2 text-paper-dim transition-colors hover:border-gold-deep hover:text-gold lg:hidden"
      >
        <Icon name="menu" width={18} height={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs animate-rise-in flex-col overflow-y-auto border-r border-line bg-ink-900 pb-6">
            <div className="flex items-center justify-between border-b border-line px-5 py-5">
              <ClubMark size="sm" />
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-paper-faint hover:text-gold"
              >
                <Icon name="x" width={18} height={18} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4">
              {adminNav.map((group) => (
                <div key={group.section} className="mb-5">
                  <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest2 text-paper-faint">
                    {group.section}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={clsx(
                            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive(item.href)
                              ? "bg-ink-700 text-gold"
                              : "text-paper-dim hover:bg-ink-800 hover:text-paper"
                          )}
                        >
                          <Icon name={item.icon} width={17} height={17} />
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center gap-2 px-3 py-2 text-xs font-medium text-paper-faint hover:text-gold"
              >
                <Icon name="arrowLeft" width={14} height={14} />
                Back to player view
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
