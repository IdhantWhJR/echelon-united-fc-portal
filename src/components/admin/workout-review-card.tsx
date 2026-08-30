"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Icon } from "@/components/icons";

export function WorkoutReviewCard({
  submission,
}: {
  submission: {
    id: string;
    videoUrl: string;
    playerNote: string | null;
    submittedAt: string;
    playerName: string;
    workoutTitle: string;
  };
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function review(status: "VERIFIED" | "NEEDS_REVISION") {
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/admin/workout-submissions/${submission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, coachFeedback: feedback || undefined }),
    });
    setSaving(false);
    if (!response.ok) {
      setError((await response.json().catch(() => ({}))).error ?? "Could not save review.");
      return;
    }
    router.refresh();
  }

  return (
    <article className="card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Awaiting review</p>
          <h2 className="font-display text-lg font-bold text-paper">{submission.workoutTitle}</h2>
          <p className="mt-1 text-sm text-paper-dim">{submission.playerName} · submitted {format(new Date(submission.submittedAt), "d MMM yyyy, h:mm a")}</p>
        </div>
        <a href={submission.videoUrl} target="_blank" rel="noreferrer" className="btn-secondary shrink-0 text-xs">
          <Icon name="video" width={14} height={14} /> Open video
        </a>
      </div>
      {submission.playerNote && <p className="mt-4 rounded-md border border-line bg-ink-900 p-3 text-sm leading-relaxed text-paper-dim"><span className="text-paper-faint">Player note: </span>{submission.playerNote}</p>}
      <div className="mt-4">
        <label htmlFor="workout-review-feedback" className="mb-1 block text-xs text-paper-dim">Feedback for player (optional)</label>
        <textarea id="workout-review-feedback" className="input-field min-h-20 resize-y" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Good control throughout. Keep the tempo consistent…" />
      </div>
      {error && <p className="mt-3 text-sm text-signal-danger">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button disabled={saving} onClick={() => review("VERIFIED")} className="btn-primary text-xs"><Icon name="check" width={14} height={14} /> Verify complete</button>
        <button disabled={saving} onClick={() => review("NEEDS_REVISION")} className="btn-secondary text-xs"><Icon name="edit" width={14} height={14} /> Needs revision</button>
      </div>
    </article>
  );
}