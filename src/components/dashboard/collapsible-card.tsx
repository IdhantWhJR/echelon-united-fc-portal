"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

export function CollapsibleCard({
  header,
  children,
  defaultCollapsed = false,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">{header}</div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand" : "Minimize"}
          className="btn-secondary shrink-0 px-2.5 py-1.5 text-[10px]"
        >
          <Icon name={collapsed ? "chevronDown" : "chevronUp"} width={13} height={13} />
          {collapsed ? "Expand" : "Minimize"}
        </button>
      </div>
      {!collapsed && <div className="mt-1">{children}</div>}
    </article>
  );
}
