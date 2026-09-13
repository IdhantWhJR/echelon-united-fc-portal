"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

export function DownloadDocumentButton({ documentId, title }: { documentId: string; title: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/documents/${documentId}/download`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not open this document.");
      return;
    }
    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        aria-label={`Download ${title}`}
        className="btn-secondary text-xs disabled:opacity-50"
      >
        <Icon name="download" width={14} height={14} />
        {loading ? "Opening…" : "Download"}
      </button>
      {error && <p className="text-[11px] text-signal-danger">{error}</p>}
    </div>
  );
}
