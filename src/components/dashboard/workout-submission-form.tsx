"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function WorkoutSubmissionForm({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [playerNote, setPlayerNote] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const response = await fetch(`/api/workouts/${assignmentId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl, playerNote: playerNote || undefined }),
    });
    setSubmitting(false);
    if (!response.ok) {
      setError((await response.json().catch(() => ({}))).error ?? "Could not submit video.");
      return;
    }
    setVideoUrl("");
    setPlayerNote("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="btn-secondary text-xs"><Icon name="upload" width={14} height={14} /> Submit video</button>;
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t border-line pt-4">
      <p className="text-xs leading-relaxed text-paper-faint">Paste a shareable video link. Your workout stays pending until a coach or admin reviews it.</p>
      <label htmlFor={`${assignmentId}-video-url`} className="sr-only">Video link</label>
      <input id={`${assignmentId}-video-url`} required type="url" className="input-field" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://drive.google.com/… or https://youtu.be/…" />
      <label htmlFor={`${assignmentId}-player-note`} className="sr-only">Note for your coach (optional)</label>
      <textarea id={`${assignmentId}-player-note`} className="input-field min-h-16 resize-y" value={playerNote} onChange={(e) => setPlayerNote(e.target.value)} placeholder="Optional note for your coach" />
      {error && <p className="text-sm text-signal-danger">{error}</p>}
      <div className="flex gap-2">
        <button disabled={submitting} className="btn-primary text-xs">{submitting ? "Sending…" : "Send for review"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-xs">Cancel</button>
      </div>
    </form>
  );
}