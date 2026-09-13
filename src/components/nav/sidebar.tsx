"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ClubMark } from "@/components/brand/club-mark";
import { Icon } from "@/components/icons";
import { primaryNav, secondaryNav } from "@/lib/nav-config";

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-ink-900 lg:flex">
      <div className="border-b border-line px-5 py-6">
        <ClubMark size="sm" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest2 text-paper-faint">
          Overview
        </p>
        <ul className="mb-6 space-y-0.5">
          {primaryNav.map((item) => (
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

        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest2 text-paper-faint">
          Club
        </p>
        <ul className="space-y-0.5">
          {secondaryNav.map((item) => (
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
      </nav>

      <div className="border-t border-line px-5 py-4">
        <p className="text-[11px] leading-relaxed text-paper-faint">
          Echelon United FC
          <br />
          Player Platform
        </p>
      </div>
    </aside>
  );
}
