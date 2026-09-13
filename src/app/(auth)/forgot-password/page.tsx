"use client";

import { useState } from "react";
import Link from "next/link";
import { ClubMark } from "@/components/brand/club-mark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm animate-rise-in">
        <div className="mb-10 flex justify-center">
          <ClubMark size="lg" />
        </div>

        <div className="card p-8">
          <p className="eyebrow mb-1">Account Recovery</p>
          <h1 className="mb-6 font-display text-2xl font-bold text-paper">Reset your password</h1>

          {sent ? (
            <p className="rounded-md border border-pitch-green/40 bg-pitch-green/10 px-3 py-3 text-sm text-paper">
              If an account exists for <span className="text-gold">{email}</span>, a reset
              link is on its way. Check your inbox.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-paper-dim">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@echelonunited.com"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-paper-faint">
          <Link href="/login" className="font-medium text-gold hover:text-gold-bright">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
