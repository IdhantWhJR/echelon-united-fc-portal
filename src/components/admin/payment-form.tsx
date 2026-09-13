"use client";

import { cloneElement, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Squad = { id: string; name: string };
type Player = { id: string; name: string; squadName: string | null; jerseyNumber: number | null };
type EventOption = { id: string; title: string };
type MatchOption = { id: string; opponent: string };

export function PaymentForm({
  squads,
  players,
  events,
  matches,
  onClose,
}: {
  squads: Squad[];
  players: Player[];
  events: EventOption[];
  matches: MatchOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [dueDate, setDueDate] = useState("");
  const [linkType, setLinkType] = useState<"none" | "event" | "match">("none");
  const [eventId, setEventId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [targetType, setTargetType] = useState("EVERYONE");
  const [squadId, setSquadId] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePlayer(id: string) {
    setSelectedPlayers((current) => (current.includes(id) ? current.filter((p) => p !== id) : [...current, id]));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) return setError("Enter an amount greater than 0.");
    if (targetType === "SQUAD" && !squadId) return setError("Choose a squad.");
    if (targetType === "INDIVIDUAL" && selectedPlayers.length === 0) return setError("Choose at least one player.");

    setSubmitting(true);
    const res = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        amount: parsedAmount,
        currency,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        eventId: linkType === "event" ? eventId || null : null,
        matchId: linkType === "match" ? matchId || null : null,
        targetType,
        squadId: squadId || null,
        playerProfileIds: selectedPlayers,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create payment.");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <form onSubmit={submit} className="card animate-rise-in space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Label">
          <input
            required
            className="input-field"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Match fee, Transport…"
          />
        </Field>
        <Field label="Send to">
          <select className="input-field" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
            <option value="EVERYONE">Everyone</option>
            <option value="SQUAD">A squad</option>
            <option value="INDIVIDUAL">Specific players</option>
          </select>
        </Field>

        <Field label="Amount">
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            className="input-field"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10.00"
          />
        </Field>
        <Field label="Currency">
          <select className="input-field" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
          </select>
        </Field>

        {targetType === "SQUAD" && (
          <Field label="Squad">
            <select className="input-field" value={squadId} onChange={(e) => setSquadId(e.target.value)}>
              <option value="">Choose a squad</option>
              {squads.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Due date (optional)">
          <input type="date" className="input-field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>

        <Field label="Attach to (optional)">
          <select
            className="input-field"
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as typeof linkType)}
          >
            <option value="none">Nothing — standalone charge</option>
            <option value="event">A calendar event</option>
            <option value="match">A match</option>
          </select>
        </Field>
        {linkType === "event" && (
          <Field label="Event">
            <select className="input-field" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">Choose an event</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </Field>
        )}
        {linkType === "match" && (
          <Field label="Match">
            <select className="input-field" value={matchId} onChange={(e) => setMatchId(e.target.value)}>
              <option value="">Choose a match</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>vs {m.opponent}</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {targetType === "INDIVIDUAL" && (
        <div>
          <label className="mb-2 block text-xs text-paper-dim">Players</label>
          <div className="grid max-h-48 gap-2 overflow-y-auto rounded-md border border-line bg-ink-900 p-3 sm:grid-cols-2">
            {players.length === 0 ? (
              <p className="text-xs text-paper-faint">No active players yet.</p>
            ) : (
              players.map((player) => (
                <label key={player.id} className="flex cursor-pointer items-center gap-2 text-sm text-paper-dim">
                  <input
                    type="checkbox"
                    checked={selectedPlayers.includes(player.id)}
                    onChange={() => togglePlayer(player.id)}
                    className="accent-gold"
                  />
                  <span>
                    {player.jerseyNumber ? `#${player.jerseyNumber} ` : ""}
                    {player.name}
                  </span>
                  {player.squadName && <span className="text-[10px] text-paper-faint">· {player.squadName}</span>}
                </label>
              ))
            )}
          </div>
        </div>
      )}

      <p className="text-[11px] text-paper-faint">
        Creates one payment record per targeted player. Each player is notified unless they've opted out of payment
        reminders. Marking a payment "Paid" is a manual record of payment received — there's no live payment
        processor connected, so nothing here fakes a real transaction.
      </p>

      {error && <p className="text-sm text-signal-danger">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={submitting} className="btn-primary text-xs">
          <Icon name="check" width={14} height={14} />
          {submitting ? "Creating…" : "Create payment"}
        </button>
        <button type="button" onClick={onClose} className="text-xs font-medium text-paper-faint hover:text-paper">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs text-paper-dim">{label}</label>
      {cloneElement(children, { id })}
    </div>
  );
}
