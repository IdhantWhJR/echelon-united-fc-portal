"use client";

import { cloneElement, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Squad = { id: string; name: string };

export function MatchForm({ squads }: { squads: Squad[] }) {
  const router = useRouter();
  const [opponent, setOpponent] = useState("");
  const [competition, setCompetition] = useState("");
  const [date, setDate] = useState("");
  const [kickoff, setKickoff] = useState("");
  const [venue, setVenue] = useState("");
  const [homeAway, setHomeAway] = useState("HOME");
  const [squadId, setSquadId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date || !kickoff) {
      setError("Date and kickoff time are required.");
      return;
    }
    const kickoffISO = new Date(`${date}T${kickoff}`).toISOString();

    setSubmitting(true);
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opponent,
        competition: competition || undefined,
        date: new Date(date).toISOString(),
        kickoff: kickoffISO,
        venue: venue || undefined,
        homeAway,
        squadId: squadId || null,
        description: description || undefined,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create match.");
      return;
    }

    const data = await res.json();
    router.push(`/admin/matches/${data.match.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5 lg:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Opponent">
          <input
            required
            className="input-field"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="Riverside FC"
          />
        </Field>
        <Field label="Competition (optional)">
          <input
            className="input-field"
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
            placeholder="League, Cup, Friendly…"
          />
        </Field>
        <Field label="Date">
          <input required type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Kickoff time">
          <input
            required
            type="time"
            className="input-field"
            value={kickoff}
            onChange={(e) => setKickoff(e.target.value)}
          />
        </Field>
        <Field label="Venue">
          <input className="input-field" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Echelon Ground" />
        </Field>
        <Field label="Home / Away">
          <select className="input-field" value={homeAway} onChange={(e) => setHomeAway(e.target.value)}>
            <option value="HOME">Home</option>
            <option value="AWAY">Away</option>
            <option value="NEUTRAL">Neutral venue</option>
          </select>
        </Field>
        <Field label="Squad (optional — leave blank for whole club)">
          <select className="input-field" value={squadId} onChange={(e) => setSquadId(e.target.value)}>
            <option value="">Everyone</option>
            {squads.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description (optional)">
        <textarea
          className="input-field min-h-[70px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes about the fixture…"
        />
      </Field>

      {error && <p className="text-sm text-signal-danger">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary text-xs">
        <Icon name="trophy" width={14} height={14} />
        {submitting ? "Creating…" : "Create match"}
      </button>
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
