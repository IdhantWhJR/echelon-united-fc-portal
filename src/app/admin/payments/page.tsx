import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { PaymentFormToggle } from "@/components/admin/payment-form-toggle";
import { PaymentRowActions } from "@/components/admin/payment-row-actions";

const STATUS_STYLES: Record<string, string> = {
  UNPAID: "border-signal-danger/40 text-signal-danger bg-signal-danger/10",
  PENDING: "border-signal-warn/40 text-signal-warn bg-signal-warn/10",
  PAID: "border-signal-success/40 text-signal-success bg-signal-success/10",
  WAIVED: "border-line text-paper-faint bg-ink-700",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { status } = searchParams;

  const [payments, squads, players, events, matches] = await Promise.all([
    prisma.payment.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        playerProfile: { include: { user: { select: { name: true } } } },
        event: { select: { title: true } },
        match: { select: { opponent: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 300,
    }),
    prisma.squad.findMany({ orderBy: { name: "asc" } }),
    prisma.playerProfile.findMany({
      where: { status: { not: "INACTIVE" }, user: { isActive: true } },
      orderBy: [{ jerseyNumber: "asc" }, { user: { name: "asc" } }],
      include: { user: { select: { name: true } }, squad: { select: { name: true } } },
    }),
    prisma.event.findMany({ orderBy: { date: "desc" }, take: 40, select: { id: true, title: true } }),
    prisma.match.findMany({ orderBy: { date: "desc" }, take: 40, select: { id: true, opponent: true } }),
  ]);

  const playerOptions = players.map((p) => ({
    id: p.id,
    name: p.user.name,
    squadName: p.squad?.name ?? null,
    jerseyNumber: p.jerseyNumber,
  }));

  const totals = payments.reduce(
    (acc, p) => {
      acc.total += p.amountMinor;
      if (p.status === "PAID") acc.paid += p.amountMinor;
      if (p.status === "UNPAID" || p.status === "PENDING") acc.outstanding += p.amountMinor;
      return acc;
    },
    { total: 0, paid: 0, outstanding: 0 }
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Club</p>
          <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Payments</h1>
          <p className="mt-1 text-sm text-paper-faint">
            {payments.length} record{payments.length === 1 ? "" : "s"} · attach fees to matches, events, or send a
            standalone charge
          </p>
        </div>
        <PaymentFormToggle
          squads={squads.map((s) => ({ id: s.id, name: s.name }))}
          players={playerOptions}
          events={events}
          matches={matches}
        />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="eyebrow mb-1">Total charged</p>
          <p className="stat-figure text-xl">{(totals.total / 100).toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="eyebrow mb-1">Collected</p>
          <p className="stat-figure text-xl text-signal-success">{(totals.paid / 100).toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="eyebrow mb-1">Outstanding</p>
          <p className="stat-figure text-xl text-signal-danger">{(totals.outstanding / 100).toFixed(2)}</p>
        </div>
      </div>

      <form method="get" className="card mb-5 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label htmlFor="payments-status-filter" className="mb-1 block text-xs text-paper-dim">Status</label>
          <select id="payments-status-filter" name="status" defaultValue={status ?? ""} className="input-field">
            <option value="">All</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="WAIVED">Waived</option>
          </select>
        </div>
        <button type="submit" className="btn-secondary text-xs">Filter</button>
      </form>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <Icon name="cash" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No payment records yet.</p>
          <p className="mt-1 text-xs text-paper-faint">Create one to attach a fee to a match, event, or the whole club.</p>
        </div>
      ) : (
        <>
          {/* Table on larger screens — columns collapse progressively, never forces horizontal scroll. */}
          <div className="card hidden overflow-hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-paper-faint">
                  <th className="px-4 py-3 font-medium">Player</th>
                  <th className="px-4 py-3 font-medium">Label</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Due</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Linked to</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-paper">{p.playerProfile.user.name}</td>
                    <td className="px-4 py-3 text-paper-dim">{p.label}</td>
                    <td className="px-4 py-3 font-mono text-paper">
                      {(p.amountMinor / 100).toFixed(2)} {p.currency}
                    </td>
                    <td className="hidden px-4 py-3 text-paper-faint md:table-cell">
                      {p.dueDate ? format(p.dueDate, "d MMM yyyy") : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-paper-faint lg:table-cell">
                      {p.match ? `vs ${p.match.opponent}` : p.event ? p.event.title : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`badge ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                        <PaymentRowActions paymentId={p.id} status={p.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked cards on mobile — same data, no forced horizontal scroll. */}
          <div className="space-y-3 sm:hidden">
            {payments.map((p) => (
              <div key={p.id} className="card p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-paper">{p.playerProfile.user.name}</p>
                    <p className="text-xs text-paper-faint">{p.label}</p>
                  </div>
                  <p className="font-mono text-sm text-paper">
                    {(p.amountMinor / 100).toFixed(2)} {p.currency}
                  </p>
                </div>
                <p className="mb-3 text-xs text-paper-faint">
                  {p.dueDate ? `Due ${format(p.dueDate, "d MMM yyyy")}` : "No due date"}
                  {p.match ? ` · vs ${p.match.opponent}` : p.event ? ` · ${p.event.title}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                  <PaymentRowActions paymentId={p.id} status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
