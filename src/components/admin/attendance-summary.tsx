type Rec = { status: string };

export function AttendanceSummary({ records }: { records: Rec[] }) {
  if (records.length === 0) {
    return <span className="text-xs text-paper-faint">No one targeted yet</span>;
  }
  const attending = records.filter((r) => r.status === "ATTENDING").length;
  const unavailable = records.filter((r) => r.status === "UNAVAILABLE").length;
  const maybe = records.filter((r) => r.status === "MAYBE").length;
  const pending = records.filter((r) => r.status === "PENDING").length;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="font-semibold text-pitch-green">{attending} attending</span>
      {unavailable > 0 && <span className="text-signal-danger">{unavailable} unavailable</span>}
      {maybe > 0 && <span className="text-signal-warn">{maybe} maybe</span>}
      {pending > 0 && <span className="text-paper-faint">{pending} pending</span>}
    </div>
  );
}
