"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function DeleteMatchButton({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this match? This removes its calendar entry, attendance, and lineup data.")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/matches/${matchId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.push("/admin/matches");
  }

  return (
    <button onClick={handleDelete} disabled={deleting} className="btn-secondary text-xs !border-signal-danger/40 !text-signal-danger hover:!border-signal-danger">
      <Icon name="x" width={14} height={14} />
      {deleting ? "Deleting…" : "Delete match"}
    </button>
  );
}
