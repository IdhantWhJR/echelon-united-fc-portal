export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="mb-6">
        <div className="mb-2 h-3 w-32 rounded bg-ink-800" />
        <div className="h-7 w-56 rounded bg-ink-800" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3">
          <div className="card h-24 p-4" />
          <div className="card h-24 p-4" />
          <div className="card h-24 p-4" />
        </div>
        <div className="card h-96 p-5" />
      </div>
    </div>
  );
}
