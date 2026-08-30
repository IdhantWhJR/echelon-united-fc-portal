import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";

const STATUS_STYLES: Record<string, string> = {
  UNPAID: "border-signal-danger/40 text-signal-danger bg-signal-danger/10",
  PENDING: "border-signal-warn/40 text-signal-warn bg-signal-warn/10",
  PAID: "border-signal-success/40 text-signal-success bg-signal-success/10",
  WAIVED: "border-line text-paper-faint bg-ink-700",
};

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    include: {
      event: { select: { title: true } },
      match: { select: { opponent: true } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  const outstanding = payments.filter((p) => p.status === "UNPAID" || p.status === "PENDING");
  const outstandingTotal = outstanding.reduce((sum, p) => sum + p.amountMinor, 0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Club</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Payments</h1>
        <p className="mt-1 text-sm text-paper-faint">Fees and charges from your club, and what's still outstanding.</p>
      </div>

      {outstanding.length > 0 && (
        <div className="card mb-5 flex items-center justify-between border-signal-danger/30 bg-signal-danger/5 p-4">
          <div>
            <p className="eyebrow mb-1 text-signal-danger">Outstanding</p>
            <p className="stat-figure text-xl text-paper">
              {(outstandingTotal / 100).toFixed(2)} {outstanding[0]?.currency ?? "GBP"}
            </p>
          </div>
          <Icon name="cash" width={22} height={22} className="text-signal-danger" />
        </div>
      )}

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <Icon name="cash" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No payments yet.</p>
          <p className="mt-1 text-xs text-paper-faint">Anything your club charges you for will show up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="card flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-display text-base font-bold text-paper">{p.label}</p>
                <p className="mt-0.5 text-xs text-paper-faint">
                  {p.match ? `vs ${p.match.opponent}` : p.event ? p.event.title : "Club charge"}
                  {p.dueDate ? ` · Due ${format(p.dueDate, "d MMM yyyy")}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <p className="font-mono text-sm text-paper">
                  {(p.amountMinor / 100).toFixed(2)} {p.currency}
                </p>
                <span className={`badge ${STATUS_STYLES[p.status]}`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-paper-faint">
        Payment status is updated by your club once payment is received — this page doesn't process payments
        directly.
      </p>
    </div>
  );
}
