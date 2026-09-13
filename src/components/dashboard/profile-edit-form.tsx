"use client";

import { cloneElement, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Profile = { name: string; email: string; phone: string };

export function ProfileEditForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save your profile.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <div className="mb-4">
        <p className="eyebrow mb-1">Profile</p>
        <p className="text-xs text-paper-faint">Update your own name, email, and contact number.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input required className="input-field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Email">
          <input required type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone (optional)">
          <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder="+44 7…" />
        </Field>
      </div>

      {error && <p className="mt-3 text-sm text-signal-danger">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={submitting} className="btn-primary text-xs">
          <Icon name="check" width={14} height={14} />
          {submitting ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-xs text-signal-success">Saved</span>}
      </div>

      {(name !== initial.name || email !== initial.email) && (
        <p className="mt-3 text-[11px] leading-relaxed text-paper-faint">
          Changing your name or email may not appear everywhere (like the topbar) until you sign in again.
        </p>
      )}

      <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-paper-faint">
        Jersey number, position, squad, and player status are set by your coaching staff — contact them for changes
        to those.
      </p>
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
