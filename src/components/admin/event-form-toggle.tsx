"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { EventForm } from "@/components/admin/event-form";

type Squad = { id: string; name: string };

export function EventFormToggle({ squads }: { squads: Squad[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-xs">
        <Icon name="plus" width={14} height={14} />
        New event
      </button>
    );
  }

  return (
    <div className="mb-5">
      <EventForm squads={squads} onClose={() => setOpen(false)} />
    </div>
  );
}
