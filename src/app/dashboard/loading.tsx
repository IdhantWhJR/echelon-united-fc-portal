export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="mb-6">
        <div className="mb-2 h-3 w-32 rounded bg-ink-800" />
        <div className="h-7 w-56 rounded bg-ink-800" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card h-40 p-5" />
          <div className="card h-56 p-5" />
        </div>
        <div className="space-y-5">
          <div className="card h-40 p-5" />
          <div className="card h-40 p-5" />
        </div>
      </div>
    </div>
  );
}
