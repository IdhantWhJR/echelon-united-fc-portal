"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function DeleteDocumentButton({ documentId, title }: { documentId: string; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${title}"? Players will no longer be able to view or download it.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/documents/${documentId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      aria-label={`Delete ${title}`}
      className="rounded-md p-2 text-paper-faint transition-colors hover:text-signal-danger focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50"
    >
      <Icon name="trash" width={14} height={14} />
    </button>
  );
}
