"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { AchievementForm } from "@/components/admin/achievement-form";

export function AchievementFormToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-xs">
        <Icon name="plus" width={14} height={14} />
        New achievement
      </button>
    );
  }

  return (
    <div className="mb-5">
      <AchievementForm onClose={() => setOpen(false)} />
    </div>
  );
}
