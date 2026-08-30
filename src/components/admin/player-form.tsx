"use client";

import { cloneElement, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Squad = { id: string; name: string };

type Values = {
  name: string;
  email: string;
  password: string;
  jerseyNumber: string;
  position: string;
  preferredFoot: string;
  heightCm: string;
  squadId: string;
  status: string;
  bio: string;
};

const POSITIONS = ["GOALKEEPER", "DEFENDER", "MIDFIELDER", "ATTACKER"];
const FEET = ["LEFT", "RIGHT", "BOTH"];
const STATUSES = ["ACTIVE", "INJURED", "SUSPENDED", "ON_LOAN", "INACTIVE"];

export function PlayerForm({
  mode,
  playerId,
  squads,
  initial,
}: {
  mode: "create" | "edit";
  playerId?: string;
  squads: Squad[];
  initial?: Partial<Values>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    password: "",
    jerseyNumber: initial?.jerseyNumber ?? "",
    position: initial?.position ?? "",
    preferredFoot: initial?.preferredFoot ?? "",
    heightCm: initial?.heightCm ?? "",
    squadId: initial?.squadId ?? "",
    status: initial?.status ?? "ACTIVE",
    bio: initial?.bio ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set<K extends keyof Values>(key: K, val: Values[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const payload: Record<string, unknown> = {
      name: values.name,
      jerseyNumber: values.jerseyNumber ? Number(values.jerseyNumber) : null,
      position: values.position || null,
      preferredFoot: values.preferredFoot || null,
      heightCm: values.heightCm ? Number(values.heightCm) : null,
      squadId: values.squadId || null,
      status: values.status,
      bio: values.bio || null,
    };

    if (mode === "create") {
      payload.email = values.email;
      payload.password = values.password;
    }

    setSubmitting(true);
    const res = await fetch(mode === "create" ? "/api/admin/players" : `/api/admin/players/${playerId}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }

    if (mode === "create") {
      const data = await res.json();
      router.push(`/admin/players/${data.player.playerProfile.id}`);
    } else {
      setSuccess(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-5 lg:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input
            required
            className="input-field"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Alex Morgan"
          />
        </Field>

        {mode === "create" && (
          <>
            <Field label="Email">
              <input
                required
                type="email"
                className="input-field"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="alex@echelonunited.com"
              />
            </Field>
            <Field label="Temporary password">
              <input
                required
                type="text"
                minLength={8}
                className="input-field"
                value={values.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="At least 8 characters"
              />
            </Field>
          </>
        )}

        <Field label="Jersey number">
          <input
            type="number"
            min={1}
            max={99}
            className="input-field"
            value={values.jerseyNumber}
            onChange={(e) => set("jerseyNumber", e.target.value)}
            placeholder="9"
          />
        </Field>

        <Field label="Position">
          <select className="input-field" value={values.position} onChange={(e) => set("position", e.target.value)}>
            <option value="">Not set</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {label(p)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Preferred foot">
          <select
            className="input-field"
            value={values.preferredFoot}
            onChange={(e) => set("preferredFoot", e.target.value)}
          >
            <option value="">Not set</option>
            {FEET.map((f) => (
              <option key={f} value={f}>
                {label(f)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Height (cm)">
          <input
            type="number"
            min={100}
            max={230}
            className="input-field"
            value={values.heightCm}
            onChange={(e) => set("heightCm", e.target.value)}
            placeholder="178"
          />
        </Field>

        <Field label="Squad">
          <select className="input-field" value={values.squadId} onChange={(e) => set("squadId", e.target.value)}>
            <option value="">Unassigned</option>
            {squads.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select className="input-field" value={values.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Bio (optional)">
        <textarea
          className="input-field min-h-[80px] resize-y"
          value={values.bio}
          onChange={(e) => set("bio", e.target.value)}
          placeholder="Short player bio, background, notes…"
        />
      </Field>

      {error && <p className="text-sm text-signal-danger">{error}</p>}
      {success && <p className="text-sm text-pitch-green">Changes saved.</p>}

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={submitting} className="btn-primary text-xs">
          <Icon name="check" width={14} height={14} />
          {submitting ? "Saving…" : mode === "create" ? "Create player" : "Save changes"}
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

function label(v: string) {
  return v
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
