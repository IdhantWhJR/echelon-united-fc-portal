"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Squad = { id: string; name: string; description: string | null; _count: { players: number } };

export function SquadManager({ squads }: { squads: Squad[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/admin/squads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create squad.");
      return;
    }
    setName("");
    setDescription("");
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/squads/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) router.refresh();
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="eyebrow">Squads</p>
        <button onClick={() => setOpen((v) => !v)} className="btn-secondary text-xs">
          <Icon name="plus" width={14} height={14} />
          New squad
        </button>
      </div>

      {open && (
        <form onSubmit={handleCreate} className="card mb-5 animate-rise-in space-y-3 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="squad-name" className="sr-only">Squad name</label>
              <input
                id="squad-name"
                required
                className="input-field"
                placeholder="Squad name (e.g. First Team)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="squad-description" className="sr-only">Description (optional)</label>
              <input
                id="squad-description"
                className="input-field"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-signal-danger">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary text-xs">
            {submitting ? "Creating…" : "Create squad"}
          </button>
        </form>
      )}

      {squads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-14 text-center">
          <Icon name="shield" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No squads yet.</p>
          <p className="mt-1 text-xs text-paper-faint">Create your first squad, e.g. "First Team" or "U21s".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {squads.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="mb-2 flex items-start justify-between">
                <h2 className="font-display text-base font-bold text-paper">{s.name}</h2>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  aria-label={`Delete ${s.name}`}
                  className="text-paper-faint hover:text-signal-danger"
                >
                  <Icon name="x" width={15} height={15} />
                </button>
              </div>
              {s.description && <p className="mb-3 text-xs text-paper-faint">{s.description}</p>}
              <p className="stat-figure text-sm text-paper-dim">{s._count.players} player{s._count.players === 1 ? "" : "s"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
