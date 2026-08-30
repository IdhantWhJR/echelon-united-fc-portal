"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { AnnouncementForm } from "@/components/admin/announcement-form";

type Squad = { id: string; name: string };
type Player = { id: string; name: string; squadName: string | null; jerseyNumber: number | null };

export function AnnouncementFormToggle({ squads, players }: { squads: Squad[]; players: Player[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-xs">
        <Icon name="plus" width={14} height={14} />
        New announcement
      </button>
    );
  }

  return (
    <div className="mb-5">
      <AnnouncementForm squads={squads} players={players} onClose={() => setOpen(false)} />
    </div>
  );
}
