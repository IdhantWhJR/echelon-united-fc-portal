import { Icon } from "@/components/icons";

export function AttendanceSummaryCard({
  presentRate,
  eventsPresent,
  eventsTotal,
  workoutsPresent,
  workoutsTotal,
}: {
  presentRate: number | null;
  eventsPresent: number;
  eventsTotal: number;
  workoutsPresent: number;
  workoutsTotal: number;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="check" width={15} height={15} className="text-gold" />
        <div>
          <p className="eyebrow mb-0.5">Your record</p>
          <h2 className="font-display text-sm font-bold text-paper">Attendance</h2>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-paper-faint">Present rate</p>
          <p className="stat-figure font-display text-xl font-bold text-gold">
            {presentRate === null ? "—" : `${presentRate}%`}
          </p>
        </div>
        <div>
          <p className="text-xs text-paper-faint">Events</p>
          <p className="stat-figure text-lg text-paper">
            {eventsPresent}/{eventsTotal}
          </p>
        </div>
        <div>
          <p className="text-xs text-paper-faint">Workouts</p>
          <p className="stat-figure text-lg text-paper">
            {workoutsPresent}/{workoutsTotal}
          </p>
        </div>
      </div>
    </div>
  );
}
