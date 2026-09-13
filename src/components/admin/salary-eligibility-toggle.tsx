"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function SalaryEligibilityToggle({
  playerId,
  eligible,
}: {
  playerId: string;
  eligible: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/admin/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salaryEligible: !eligible }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <section className="card p-5">
      <p className="eyebrow mb-3">Salary eligibility</p>
      <div className="flex items-center justify-between gap-3">
        <span className={`badge ${eligible ? "border-pitch-green/40 text-pitch-green" : "border-signal-danger/40 text-signal-danger"}`}>
          <Icon name={eligible ? "check" : "x"} width={12} height={12} />
          {eligible ? "Eligible" : "Not eligible"}
        </span>
        <button onClick={toggle} disabled={busy} className="btn-secondary text-xs">
          {busy ? "Saving…" : eligible ? "Mark not eligible" : "Mark eligible"}
        </button>
      </div>
      <p className="mt-2 text-xs text-paper-faint">
        Manually set by staff. This player will {eligible ? "" : "not "}be shown as eligible for salary.
      </p>
    </section>
  );
}
