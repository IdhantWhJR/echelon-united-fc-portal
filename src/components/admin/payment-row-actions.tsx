"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

const STATUSES = ["UNPAID", "PENDING", "PAID", "WAIVED"];

export function PaymentRowActions({ paymentId, status }: { paymentId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function updateStatus(next: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  async function remind() {
    setBusy(true);
    const res = await fetch(`/api/admin/payments/${paymentId}/remind`, { method: "POST" });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this payment record?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/payments/${paymentId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status}
        disabled={busy}
        onChange={(e) => updateStatus(e.target.value)}
        className="input-field !w-auto py-1.5 text-xs"
        aria-label="Payment status"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
        ))}
      </select>
      {(status === "UNPAID" || status === "PENDING") && (
        <button
          onClick={remind}
          disabled={busy}
          className="text-xs font-medium text-gold hover:underline disabled:opacity-50"
        >
          Remind
        </button>
      )}
      <button
        onClick={remove}
        disabled={busy}
        aria-label="Delete payment"
        className="text-paper-faint transition-colors hover:text-signal-danger disabled:opacity-50"
      >
        <Icon name="x" width={14} height={14} />
      </button>
    </div>
  );
}
