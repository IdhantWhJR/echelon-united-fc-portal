"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { AchievementForm } from "@/components/admin/achievement-form";
import { AwardAchievementDialog } from "@/components/admin/award-achievement-dialog";

type Player = { id: string; name: string; jerseyNumber: number | null; squadName: string | null };
type Achievement = {
  id: string;
  title: string;
  description: string | null;
  iconKey: string | null;
  awardedCount: number;
};

export function AchievementList({
  achievements,
  players,
  suggestionsByAchievement,
}: {
  achievements: Achievement[];
  players: Player[];
  suggestionsByAchievement: Record<string, string[]>;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [awardingId, setAwardingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this achievement? This also removes it from every player it was awarded to.")) return;
    setDeletingId(id);
    await fetch(`/api/admin/achievements/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {achievements.map((a) => {
        const suggested = suggestionsByAchievement[a.id] ?? [];
        return (
          <div key={a.id} className="card p-4">
            {editingId === a.id ? (
              <AchievementForm
                initial={{ id: a.id, title: a.title, description: a.description ?? "", iconKey: a.iconKey ?? "medal" }}
                onClose={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-deep/40 bg-gold/10 text-gold">
                      <Icon name={a.iconKey ?? "medal"} width={16} height={16} />
                    </span>
                    <p className="font-display text-base font-bold text-paper">{a.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingId(a.id)} aria-label={`Edit ${a.title}`} className="text-paper-faint hover:text-gold">
                      <Icon name="edit" width={14} height={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      aria-label={`Delete ${a.title}`}
                      className="text-paper-faint hover:text-signal-danger disabled:opacity-50"
                    >
                      <Icon name="x" width={14} height={14} />
                    </button>
                  </div>
                </div>
                {a.description && <p className="mb-3 text-sm leading-relaxed text-paper-dim">{a.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-paper-faint">
                    Awarded to {a.awardedCount} player{a.awardedCount === 1 ? "" : "s"}
                  </span>
                  <button onClick={() => setAwardingId(a.id)} className="btn-secondary text-xs">
                    <Icon name="medal" width={13} height={13} />
                    Award{suggested.length > 0 ? ` (${suggested.length} qualify)` : ""}
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}

      {awardingId && (
        <AwardAchievementDialog
          achievementId={awardingId}
          achievementTitle={achievements.find((a) => a.id === awardingId)?.title ?? ""}
          players={players}
          suggestedPlayerIds={suggestionsByAchievement[awardingId] ?? []}
          onClose={() => setAwardingId(null)}
        />
      )}
    </div>
  );
}
