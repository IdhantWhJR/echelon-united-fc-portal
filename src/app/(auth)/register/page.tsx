"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClubMark } from "@/components/brand/club-mark";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm animate-rise-in">
        <div className="mb-10 flex justify-center">
          <ClubMark size="lg" />
        </div>

        <div className="card p-8">
          <div className="mb-6">
            <p className="eyebrow mb-1">Join the Club</p>
            <h1 className="font-display text-2xl font-bold text-paper">Create your account</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-paper-dim">
                Full name
              </label>
              <input
                id="name"
                required
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
              />
            </div>
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
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-paper-dim">
                Password
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
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-paper-faint">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-gold hover:text-gold-bright">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
