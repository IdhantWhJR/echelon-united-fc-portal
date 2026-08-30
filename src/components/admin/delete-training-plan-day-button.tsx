"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function DeleteTrainingPlanDayButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!window.confirm("Remove this training plan day?")) return;
    setDeleting(true);
    const response = await fetch(`/api/admin/training-plans/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (response.ok) router.refresh();
  }

  return (
    <button onClick={remove} disabled={deleting} aria-label="Remove plan day" className="rounded p-1.5 text-paper-faint hover:bg-ink-700 hover:text-signal-danger">
      <Icon name="x" width={15} height={15} />
    </button>
  );
}