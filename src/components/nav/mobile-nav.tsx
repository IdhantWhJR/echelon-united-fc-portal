"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Icon } from "@/components/icons";
import { mobileNav } from "@/lib/nav-config";

export function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink-900/95 backdrop-blur lg:hidden">
      <ul className="flex items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)]">
        {mobileNav.map((item) => (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                isActive(item.href) ? "text-gold" : "text-paper-faint"
              )}
            >
              <Icon name={item.icon} width={20} height={20} />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
