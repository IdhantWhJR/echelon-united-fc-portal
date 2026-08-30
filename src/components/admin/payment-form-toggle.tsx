"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { PaymentForm } from "@/components/admin/payment-form";

type Squad = { id: string; name: string };
type Player = { id: string; name: string; squadName: string | null; jerseyNumber: number | null };
type EventOption = { id: string; title: string };
type MatchOption = { id: string; opponent: string };

export function PaymentFormToggle({
  squads,
  players,
  events,
  matches,
}: {
  squads: Squad[];
  players: Player[];
  events: EventOption[];
  matches: MatchOption[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-xs">
        <Icon name="plus" width={14} height={14} />
        New payment
      </button>
    );
  }

  return (
    <div className="mb-5">
      <PaymentForm squads={squads} players={players} events={events} matches={matches} onClose={() => setOpen(false)} />
    </div>
  );
}
