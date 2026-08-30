"use client";

import { cloneElement, useId, useState } from "react";
import { Icon } from "@/components/icons";

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not change your password.");
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <div className="mb-4">
        <p className="eyebrow mb-1">Password</p>
        <p className="text-xs text-paper-faint">Your current password is required to set a new one.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Current password">
          <input
            required
            type="password"
            autoComplete="current-password"
            className="input-field"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <Field label="New password">
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="input-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="input-field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
      </div>

      {error && <p className="mt-3 text-sm text-signal-danger">{error}</p>}
      {success && <p className="mt-3 text-sm text-signal-success">Password updated.</p>}

      <div className="mt-4">
        <button type="submit" disabled={submitting} className="btn-primary text-xs">
          <Icon name="check" width={14} height={14} />
          {submitting ? "Updating…" : "Update password"}
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
