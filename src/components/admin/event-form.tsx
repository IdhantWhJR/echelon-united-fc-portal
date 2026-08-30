"use client";

import { cloneElement, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Squad = { id: string; name: string };

const TYPES = [
  { value: "TRAINING", label: "Training" },
  { value: "TEAM_EVENT", label: "Team event" },
  { value: "OTHER", label: "Other" },
];

export function EventForm({ squads, onClose }: { squads: Squad[]; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("TRAINING");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [squadId, setSquadId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date || !startTime) {
      setError("Date and start time are required.");
      return;
    }

    const startISO = new Date(`${date}T${startTime}`).toISOString();
    const endISO = endTime ? new Date(`${date}T${endTime}`).toISOString() : undefined;

    setSubmitting(true);
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        type,
        date: new Date(date).toISOString(),
        startTime: startISO,
        endTime: endISO,
        location: location || undefined,
        description: description || undefined,
        squadId: squadId || null,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create event.");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="card animate-rise-in space-y-4 p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input
            required
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Team Training"
          />
        </Field>
        <Field label="Type">
          <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input
            required
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start time">
            <input
              required
              type="time"
              className="input-field"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Field>
          <Field label="End time (optional)">
            <input
              type="time"
              className="input-field"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Location">
          <input
            className="input-field"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Echelon Training Ground"
          />
        </Field>
        <Field label="Squad (optional — leave blank for club-wide)">
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

      <Field label="Description / notes (optional)">
        <textarea
          className="input-field min-h-[70px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What players need to know…"
        />
      </Field>

      {error && <p className="text-sm text-signal-danger">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={submitting} className="btn-primary text-xs">
          <Icon name="check" width={14} height={14} />
          {submitting ? "Creating…" : "Create event"}
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
