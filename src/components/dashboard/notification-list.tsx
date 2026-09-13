"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Icon } from "@/components/icons";
import { clsx } from "clsx";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  ANNOUNCEMENT: "alert",
  TRAINING_REMINDER: "activity",
  MATCH_REMINDER: "shield",
  LOCATION_CHANGE: "mapPin",
  WORKOUT_ASSIGNED: "clipboard",
  WORKOUT_APPROVED: "check",
  WORKOUT_REVISION: "edit",
  LEARNING_CONTENT: "book",
  POLL_AVAILABLE: "poll",
  PAYMENT_REMINDER: "cash",
  GENERAL: "bell",
};

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(notifications);
  const unreadCount = items.filter((n) => !n.isRead).length;

  async function markOneRead(id: string) {
    setItems((current) => current.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    startTransition(() => router.refresh());
  }

  async function markAllRead() {
    setItems((current) => current.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    startTransition(() => router.refresh());
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
        <Icon name="bell" width={22} height={22} className="mb-3 text-paper-faint" />
        <p className="text-sm font-medium text-paper">No notifications yet.</p>
        <p className="mt-1 text-xs text-paper-faint">Updates about announcements, workouts, and more will show up here.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-paper-faint">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={isPending}
            className="text-xs font-medium text-gold hover:underline disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="card divide-y divide-line overflow-hidden">
        {items.map((n) => {
          const content = (
            <div
              className={clsx(
                "flex items-start gap-3 px-4 py-3.5 transition-colors",
                !n.isRead && "bg-gold/5"
              )}
            >
              <span
                className={clsx(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                  n.isRead ? "border-line text-paper-faint" : "border-gold-deep/50 text-gold"
                )}
              >
                <Icon name={TYPE_ICON[n.type] ?? "bell"} width={14} height={14} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={clsx("text-sm", n.isRead ? "text-paper-dim" : "font-medium text-paper")}>{n.title}</p>
                  {!n.isRead && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
                </div>
                <p className="mt-0.5 text-xs text-paper-faint">{n.body}</p>
                <p className="mt-1 text-[11px] text-paper-faint">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );

          return (
            <div key={n.id} className="group relative">
              {n.link ? (
                <Link href={n.link} onClick={() => !n.isRead && markOneRead(n.id)} className="block hover:bg-ink-700">
                  {content}
                </Link>
              ) : (
                <button onClick={() => !n.isRead && markOneRead(n.id)} className="block w-full text-left hover:bg-ink-700">
                  {content}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
