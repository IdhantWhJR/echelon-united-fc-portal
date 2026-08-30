"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function DeleteEventButton({ eventId, label }: { eventId: string; label?: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this event? This also clears its attendance records.")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      aria-label={label ?? "Delete event"}
      className="text-paper-faint transition-colors hover:text-signal-danger disabled:opacity-50"
    >
      <Icon name="x" width={14} height={14} />
    </button>
  );
}
