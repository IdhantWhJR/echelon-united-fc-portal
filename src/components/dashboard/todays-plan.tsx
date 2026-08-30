import { format } from "date-fns";
import { Icon } from "@/components/icons";

export type PlanItem = {
  id: string;
  kind: "TRAINING" | "MATCH" | "TEAM_EVENT" | "WORKOUT" | "LEARNING";
  title: string;
  subtitle?: string;
  time?: string;
};

const KIND_META: Record<PlanItem["kind"], { label: string; icon: string; color: string }> = {
  TRAINING: { label: "Training", icon: "activity", color: "text-gold" },
  MATCH: { label: "Match", icon: "shield", color: "text-gold" },
  TEAM_EVENT: { label: "Event", icon: "calendar", color: "text-signal-info" },
  WORKOUT: { label: "Workout", icon: "activity", color: "text-signal-warn" },
  LEARNING: { label: "Learning", icon: "book", color: "text-signal-info" },
};

export function TodaysPlan({ items, today }: { items: PlanItem[]; today: Date }) {
  return (
    <div className="card p-5 lg:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="eyebrow mb-1">Today's Plan</p>
          <h2 className="font-display text-lg font-bold text-paper">{format(today, "EEEE, MMMM d")}</h2>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-line py-8 text-center">
          <p className="text-sm font-medium text-paper">Nothing scheduled today.</p>
          <p className="mt-1 text-xs text-paper-faint">Enjoy the rest — check the calendar for what's next.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const meta = KIND_META[item.kind];
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-md border border-line bg-ink-900 p-3.5"
              >
                <div className={`mt-0.5 rounded-sm border border-line bg-ink-700 p-1.5 ${meta.color}`}>
                  <Icon name={meta.icon} width={15} height={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[10px] font-semibold uppercase tracking-wide ${meta.color}`}>
                      {meta.label}
                    </p>
                    {item.time && (
                      <p className="stat-figure whitespace-nowrap text-xs text-paper-dim">{item.time}</p>
                    )}
                  </div>
                  <p className="truncate text-sm font-medium text-paper">{item.title}</p>
                  {item.subtitle && (
                    <p className="truncate text-xs text-paper-faint">{item.subtitle}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
