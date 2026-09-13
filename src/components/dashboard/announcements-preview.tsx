import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Icon } from "@/components/icons";

const CATEGORY_STYLES: Record<string, string> = {
  URGENT: "border-signal-danger/40 text-signal-danger bg-signal-danger/10",
  IMPORTANT: "border-gold-deep/50 text-gold bg-gold/10",
  MATCH: "border-signal-info/40 text-signal-info bg-signal-info/10",
  TRAINING: "border-signal-warn/40 text-signal-warn bg-signal-warn/10",
  GENERAL: "border-line text-paper-dim bg-ink-700",
};

export function AnnouncementsPreview({
  announcements,
}: {
  announcements: { id: string; title: string; message: string; category: string; createdAt: string }[];
}) {
  return (
    <div className="card p-5 lg:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="eyebrow">Announcements</p>
        <Link href="/dashboard/announcements" className="text-xs font-medium text-paper-faint hover:text-gold">
          View all →
        </Link>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-line py-8 text-center">
          <Icon name="alert" width={20} height={20} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No announcements.</p>
          <p className="mt-1 text-xs text-paper-faint">Club updates will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li key={a.id} className="rounded-md border border-line bg-ink-900 p-3.5">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className={`badge ${CATEGORY_STYLES[a.category] ?? CATEGORY_STYLES.GENERAL}`}>
                  {a.category}
                </span>
                <span className="text-[11px] text-paper-faint">
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm font-medium text-paper">{a.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-paper-faint">{a.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
