"use client";

import { cloneElement, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Initial = { id?: string; title: string; description: string; iconKey: string };

export function AchievementForm({ initial, onClose }: { initial?: Initial; onClose: () => void }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [iconKey, setIconKey] = useState(initial?.iconKey ?? "medal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const url = isEdit ? `/api/admin/achievements/${initial!.id}` : "/api/admin/achievements";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, iconKey }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save this achievement.");
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
            placeholder="100% Training Attendance"
          />
        </Field>
        <Field label="Icon">
          <select className="input-field" value={iconKey} onChange={(e) => setIconKey(e.target.value)}>
            <option value="medal">Medal</option>
            <option value="trophy">Trophy</option>
            <option value="shield">Shield</option>
            <option value="check">Check</option>
            <option value="trending">Trending</option>
          </select>
        </Field>
      </div>
      <Field label="Description (optional)">
        <textarea
          className="input-field min-h-20 resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Awarded for a full season without a missed session."
        />
      </Field>

      {error && <p className="text-sm text-signal-danger">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={submitting} className="btn-primary text-xs">
          <Icon name="check" width={14} height={14} />
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create achievement"}
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
