"use client";

import { cloneElement, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Squad = { id: string; name: string };
type Player = { id: string; name: string; squadName: string | null; jerseyNumber: number | null };

const CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "TRAINING", label: "Training" },
  { value: "MATCH", label: "Match" },
  { value: "IMPORTANT", label: "Important" },
  { value: "URGENT", label: "Urgent" },
];

export function AnnouncementForm({
  squads,
  players,
  onClose,
}: {
  squads: Squad[];
  players: Player[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState(0);
  const [targetType, setTargetType] = useState("EVERYONE");
  const [squadId, setSquadId] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePlayer(id: string) {
    setSelectedPlayers((current) => (current.includes(id) ? current.filter((p) => p !== id) : [...current, id]));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (targetType === "SQUAD" && !squadId) return setError("Choose a squad.");
    if (targetType === "INDIVIDUAL" && selectedPlayers.length === 0) return setError("Choose at least one player.");

    setSubmitting(true);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        message,
        category,
        priority,
        targetType,
        squadId: squadId || null,
        playerProfileIds: selectedPlayers,
        attachmentUrl: attachmentUrl || "",
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not post announcement.");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <form onSubmit={submit} className="card animate-rise-in space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input
            required
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Training moved to 6:30 PM"
          />
        </Field>
        <Field label="Category">
          <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Send to">
          <select className="input-field" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
            <option value="EVERYONE">Everyone</option>
            <option value="SQUAD">A squad</option>
            <option value="INDIVIDUAL">Specific players</option>
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
        <Field label="Priority (0 = normal, higher shows first)">
          <input
            type="number"
            min={0}
            max={10}
            className="input-field"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          />
        </Field>
        <Field label="Attachment URL (optional)">
          <input
            type="url"
            className="input-field"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            placeholder="https://…"
          />
        </Field>
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
          <p className="mt-1.5 text-[11px] text-paper-faint">
            Individually targeted announcements notify just these players — they still appear in the general feed as
            a club-wide post.
          </p>
        </div>
      )}

      <Field label="Message">
        <textarea
          required
          className="input-field min-h-28 resize-y"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What players need to know…"
        />
      </Field>

      {error && <p className="text-sm text-signal-danger">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={submitting} className="btn-primary text-xs">
          <Icon name="check" width={14} height={14} />
          {submitting ? "Posting…" : "Post announcement"}
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
