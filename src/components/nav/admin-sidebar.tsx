"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ClubMark } from "@/components/brand/club-mark";
import { Icon } from "@/components/icons";
import { adminNav } from "@/lib/admin-nav-config";

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-ink-900 lg:flex">
      <div className="border-b border-line px-5 py-6">
        <ClubMark size="sm" />
        <span className="mt-3 inline-block rounded-sm border border-gold-deep/50 bg-gold/10 px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-widest2 text-gold">
          Staff Panel
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
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
      </nav>

      <div className="border-t border-line px-5 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-medium text-paper-faint transition-colors hover:text-gold"
        >
          <Icon name="arrowLeft" width={14} height={14} />
          Back to player view
        </Link>
      </div>
    </aside>
  );
}
