"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function DeleteAnnouncementButton({ announcementId }: { announcementId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this announcement? It will disappear from every player's dashboard.")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/announcements/${announcementId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      aria-label="Delete announcement"
      className="text-paper-faint transition-colors hover:text-signal-danger disabled:opacity-50"
    >
      <Icon name="x" width={14} height={14} />
    </button>
  );
}
