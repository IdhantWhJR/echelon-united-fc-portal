"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { DocumentForm } from "@/components/admin/document-form";

export function DocumentFormToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-xs">
        <Icon name="upload" width={14} height={14} />
        Upload document
      </button>
    );
  }

  return (
    <div className="mb-5">
      <DocumentForm onClose={() => setOpen(false)} />
    </div>
  );
}
