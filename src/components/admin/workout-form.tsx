"use client";

import { cloneElement, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Squad = { id: string; name: string };
type Player = { id: string; name: string; squadName: string | null; jerseyNumber: number | null };
type Exercise = { name: string; sets: string; reps: string; durationSec: string; restSec: string };

const emptyExercise = (): Exercise => ({ name: "", sets: "", reps: "", durationSec: "", restSec: "" });

export function WorkoutForm({ squads, players }: { squads: Squad[]; players: Player[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [instructions, setInstructions] = useState("");
  const [coachNotes, setCoachNotes] = useState("");
  const [videoDemoUrl, setVideoDemoUrl] = useState("");
  const [targetType, setTargetType] = useState("EVERYONE");
  const [squadId, setSquadId] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([emptyExercise()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateExercise(index: number, key: keyof Exercise, value: string) {
    setExercises((current) => current.map((exercise, i) => (i === index ? { ...exercise, [key]: value } : exercise)));
  }

  function togglePlayer(id: string) {
    setSelectedPlayers((current) => (current.includes(id) ? current.filter((playerId) => playerId !== id) : [...current, id]));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!date) return setError("Workout date is required.");
    if (targetType === "SQUAD" && !squadId) return setError("Choose a squad.");
    if (targetType === "INDIVIDUAL" && selectedPlayers.length === 0) return setError("Choose at least one player.");
    if (exercises.some((exercise) => !exercise.name.trim())) return setError("Every exercise needs a name.");

    setSubmitting(true);
    const response = await fetch("/api/admin/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        date: new Date(date).toISOString(),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        instructions: instructions || undefined,
        coachNotes: coachNotes || undefined,
        videoDemoUrl: videoDemoUrl || "",
        targetType,
        squadId: squadId || null,
        playerProfileIds: selectedPlayers,
        exercises: exercises.map((exercise, index) => ({
          name: exercise.name,
          sets: exercise.sets ? Number(exercise.sets) : null,
          reps: exercise.reps || null,
          durationSec: exercise.durationSec ? Number(exercise.durationSec) : null,
          restSec: exercise.restSec ? Number(exercise.restSec) : null,
          order: index,
        })),
      }),
    });
    setSubmitting(false);
    if (!response.ok) {
      setError((await response.json().catch(() => ({}))).error ?? "Could not create workout.");
      return;
    }
    setTitle("");
    setDescription("");
    setDate("");
    setDeadline("");
    setInstructions("");
    setCoachNotes("");
    setVideoDemoUrl("");
    setExercises([emptyExercise()]);
    setSelectedPlayers([]);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-5 lg:p-6">
      <div>
        <p className="eyebrow mb-1">New assignment</p>
        <p className="text-xs leading-relaxed text-paper-faint">
          Players can submit a video link, but only a coach or admin can verify completion.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Workout title">
          <input required className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lower body strength" />
        </Field>
        <Field label="Assign to">
          <select className="input-field" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
            <option value="EVERYONE">All active players</option>
            <option value="SQUAD">A squad</option>
            <option value="INDIVIDUAL">Specific players</option>
          </select>
        </Field>
        {targetType === "SQUAD" && (
          <Field label="Squad">
            <select className="input-field" value={squadId} onChange={(e) => setSquadId(e.target.value)}>
              <option value="">Choose a squad</option>
              {squads.map((squad) => <option key={squad.id} value={squad.id}>{squad.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Workout date">
          <input required type="datetime-local" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Deadline (optional)">
          <input type="datetime-local" className="input-field" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Demo video URL (optional)">
          <input type="url" className="input-field" value={videoDemoUrl} onChange={(e) => setVideoDemoUrl(e.target.value)} placeholder="https://…" />
        </Field>
      </div>

      {targetType === "INDIVIDUAL" && (
        <div>
          <label className="mb-2 block text-xs text-paper-dim">Players</label>
          <div className="grid max-h-48 gap-2 overflow-y-auto rounded-md border border-line bg-ink-900 p-3 sm:grid-cols-2">
            {players.length === 0 ? <p className="text-xs text-paper-faint">No active players yet.</p> : players.map((player) => (
              <label key={player.id} className="flex cursor-pointer items-center gap-2 text-sm text-paper-dim">
                <input type="checkbox" checked={selectedPlayers.includes(player.id)} onChange={() => togglePlayer(player.id)} className="accent-gold" />
                <span>{player.jerseyNumber ? `#${player.jerseyNumber} ` : ""}{player.name}</span>
                {player.squadName && <span className="text-[10px] text-paper-faint">· {player.squadName}</span>}
              </label>
            ))}
          </div>
        </div>
      )}

      <Field label="Description (optional)">
        <textarea className="input-field min-h-20 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this session is designed to improve…" />
      </Field>
      <Field label="Player instructions (optional)">
        <textarea className="input-field min-h-24 resize-y" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Warm up first. Complete all sets with controlled tempo…" />
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs text-paper-dim">Exercises</label>
          <button type="button" onClick={() => setExercises((current) => [...current, emptyExercise()])} className="btn-secondary px-2.5 py-1.5 text-[10px]">
            <Icon name="plus" width={13} height={13} /> Add exercise
          </button>
        </div>
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <div key={index} className="rounded-md border border-line bg-ink-900 p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-xs font-semibold uppercase tracking-wide text-gold">Exercise {index + 1}</span>
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setExercises((current) => current.filter((_, i) => i !== index))}
                    aria-label={`Remove exercise ${index + 1}`}
                    className="p-1 text-paper-faint hover:text-signal-danger"
                  >
                    <Icon name="x" width={14} height={14} />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-6">
                <div className="sm:col-span-2"><input required className="input-field" value={exercise.name} onChange={(e) => updateExercise(index, "name", e.target.value)} placeholder="Exercise name" /></div>
                <input type="number" min="1" className="input-field" value={exercise.sets} onChange={(e) => updateExercise(index, "sets", e.target.value)} placeholder="Sets" />
                <input className="input-field" value={exercise.reps} onChange={(e) => updateExercise(index, "reps", e.target.value)} placeholder="Reps / time" />
                <input type="number" min="1" className="input-field" value={exercise.durationSec} onChange={(e) => updateExercise(index, "durationSec", e.target.value)} placeholder="Duration sec" />
                <input type="number" min="0" className="input-field" value={exercise.restSec} onChange={(e) => updateExercise(index, "restSec", e.target.value)} placeholder="Rest sec" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Field label="Private coach notes (optional)">
        <textarea className="input-field min-h-20 resize-y" value={coachNotes} onChange={(e) => setCoachNotes(e.target.value)} placeholder="Internal notes for the reviewing coach…" />
      </Field>
      {error && <p className="text-sm text-signal-danger">{error}</p>}
      <button disabled={submitting} className="btn-primary text-xs">
        <Icon name="clipboard" width={14} height={14} /> {submitting ? "Assigning…" : "Create workout"}
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