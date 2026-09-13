"use client";

import { cloneElement, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Squad = { id: string; name: string };

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function TrainingPlanForm({ squads }: { squads: Squad[] }) {
  const router = useRouter();
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [focus, setFocus] = useState("");
  const [description, setDescription] = useState("");
  const [squadId, setSquadId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const response = await fetch("/api/admin/training-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayOfWeek: Number(dayOfWeek),
        focus,
        description: description || undefined,
        squadId: squadId || null,
      }),
    });
    setSubmitting(false);
    if (!response.ok) {
      setError((await response.json().catch(() => ({}))).error ?? "Could not add plan day.");
      return;
    }
    setFocus("");
    setDescription("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div>
        <p className="eyebrow mb-1">Add plan day</p>
        <p className="text-xs text-paper-faint">Set the weekly focus players should see in their Training section.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Day">
          <select className="input-field" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
            {DAYS.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Squad">
          <select className="input-field" value={squadId} onChange={(e) => setSquadId(e.target.value)}>
            <option value="">Club-wide</option>
            {squads.map((squad) => (
              <option key={squad.id} value={squad.id}>
                {squad.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Focus">
        <input required className="input-field" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Strength and conditioning" />
      </Field>
      <Field label="Coach guidance (optional)">
        <textarea className="input-field min-h-20 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What should players prioritize?" />
      </Field>
      {error && <p className="text-sm text-signal-danger">{error}</p>}
      <button disabled={submitting} className="btn-primary text-xs">
        <Icon name="plus" width={14} height={14} />
        {submitting ? "Adding…" : "Add plan day"}
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