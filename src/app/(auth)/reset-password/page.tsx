"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClubMark } from "@/components/brand/club-mark";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm animate-rise-in">
        <div className="mb-10 flex justify-center">
          <ClubMark size="lg" />
        </div>
        <div className="card p-8">
          <p className="eyebrow mb-1">Account Recovery</p>
          <h1 className="mb-6 font-display text-2xl font-bold text-paper">Choose a new password</h1>

          {!token ? (
            <p className="rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
              This link is missing a reset token. Please request a new one.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-paper-dim">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              {error && (
                <p role="alert" className="rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
