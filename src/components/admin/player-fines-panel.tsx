"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Fine = {
  id: string;
  reason: string;
  amountMinor: number;
  currency: string;
  status: "UNPAID" | "PAID" | "WAIVED";
  issuedAt: string;
  issuedByName: string;
};

const STATUS_STYLE: Record<Fine["status"], string> = {
  UNPAID: "border-signal-danger/40 text-signal-danger",
  PAID: "border-pitch-green/40 text-pitch-green",
  WAIVED: "border-line text-paper-faint",
};

export function PlayerFinesPanel({ playerId, fines }: { playerId: string; fines: Fine[] }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const totalOwed = fines.filter((f) => f.status === "UNPAID").reduce((sum, f) => sum + f.amountMinor, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!reason.trim()) return setError("Give a reason for the fine.");
    if (!value || value <= 0) return setError("Enter an amount greater than 0.");

    setSubmitting(true);
    const res = await fetch("/api/admin/fines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerProfileId: playerId, reason, amount: value, note: note || undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not create fine.");
      return;
    }
    setReason("");
    setAmount("");
    setNote("");
    router.refresh();
  }

  async function setStatus(id: string, status: Fine["status"]) {
    setBusyId(id);
    await fetch(`/api/admin/fines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function remove(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/fines/${id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow">Fines</p>
        <span className="font-mono text-sm font-semibold text-signal-danger">
          Owed: £{(totalOwed / 100).toFixed(2)}
        </span>
      </div>

      {fines.length === 0 ? (
        <p className="py-2 text-sm text-paper-faint">No fines on record.</p>
      ) : (
        <ul className="mb-4 divide-y divide-line">
          {fines.map((f) => (
            <li key={f.id} className="py-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-paper">{f.reason}</p>
                  <p className="text-xs text-paper-faint">Issued by {f.issuedByName}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-paper">£{(f.amountMinor / 100).toFixed(2)}</span>
                  <span className={`badge ${STATUS_STYLE[f.status]}`}>{f.status}</span>
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                {f.status !== "PAID" && (
                  <button
                    disabled={busyId === f.id}
                    onClick={() => setStatus(f.id, "PAID")}
                    className="text-xs text-pitch-green hover:underline"
                  >
                    Mark paid
                  </button>
                )}
                {f.status !== "WAIVED" && (
                  <button
                    disabled={busyId === f.id}
                    onClick={() => setStatus(f.id, "WAIVED")}
                    className="text-xs text-paper-faint hover:underline"
                  >
                    Waive
                  </button>
                )}
                {f.status !== "UNPAID" && (
                  <button
                    disabled={busyId === f.id}
                    onClick={() => setStatus(f.id, "UNPAID")}
                    className="text-xs text-paper-faint hover:underline"
                  >
                    Reset to unpaid
                  </button>
                )}
                <button
                  disabled={busyId === f.id}
                  onClick={() => remove(f.id)}
                  className="ml-auto text-xs text-signal-danger hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-2 border-t border-line pt-3">
        <p className="text-xs text-paper-dim">Add a fine</p>
        <input className="input-field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (e.g. Late to training)" />
        <input type="number" min="0.01" step="0.01" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (£)" />
        <input className="input-field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note (optional)" />
        {error && <p className="text-xs text-signal-danger">{error}</p>}
        <button disabled={submitting} className="btn-primary w-full text-xs">
          <Icon name="plus" width={13} height={13} /> {submitting ? "Adding…" : "Add fine"}
        </button>
      </form>
    </section>
  );
}
