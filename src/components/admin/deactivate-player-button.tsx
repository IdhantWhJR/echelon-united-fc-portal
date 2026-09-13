"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function DeactivatePlayerButton({ playerId, isActive }: { playerId: string; isActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDeactivate() {
    setBusy(true);
    await fetch(`/api/admin/players/${playerId}`, { method: "DELETE" });
    setBusy(false);
    setConfirming(false);
    router.refresh();
  }

  async function handleReactivate() {
    setBusy(true);
    await fetch(`/api/admin/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true, status: "ACTIVE" }),
    });
    setBusy(false);
    router.refresh();
  }

  if (!isActive) {
    return (
      <button onClick={handleReactivate} disabled={busy} className="btn-secondary text-xs">
        <Icon name="check" width={14} height={14} />
        {busy ? "Reactivating…" : "Reactivate player"}
      </button>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-paper-faint">Deactivate this player's account?</span>
        <button
          onClick={handleDeactivate}
          disabled={busy}
          className="rounded-md border border-signal-danger/50 px-3 py-1.5 text-xs font-semibold text-signal-danger hover:bg-signal-danger/10"
        >
          {busy ? "Working…" : "Confirm"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-paper-faint hover:text-paper">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="btn-secondary text-xs !border-signal-danger/40 !text-signal-danger">
      <Icon name="x" width={14} height={14} />
      Deactivate
    </button>
  );
}
