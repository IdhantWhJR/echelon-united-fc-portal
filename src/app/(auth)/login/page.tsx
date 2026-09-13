"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClubMark } from "@/components/brand/club-mark";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4">
      {/* Ambient hairline pitch-lines in the background — quiet, not decorative noise */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-paper" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper" />
      </div>

      <div className="relative w-full max-w-sm animate-rise-in">
        <div className="mb-10 flex justify-center">
          <ClubMark size="lg" />
        </div>

        <div className="card p-8">
          <div className="mb-6">
            <p className="eyebrow mb-1">Player &amp; Staff Portal</p>
            <h1 className="font-display text-2xl font-bold text-paper">Sign in</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-paper-dim">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@echelonunited.com"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-paper-dim">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-gold hover:text-gold-bright">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-paper-faint">
          New to the club?{" "}
          <Link href="/register" className="font-medium text-gold hover:text-gold-bright">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
