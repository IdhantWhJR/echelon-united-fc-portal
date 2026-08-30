import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";

// POST /api/admin/payments/[id]/remind
// Staff-only. Sends a one-off reminder notification for a still-outstanding
// payment, respecting the player's paymentReminders preference.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const payment = await prisma.payment.findUnique({ where: { id: params.id } });
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    if (payment.status === "PAID" || payment.status === "WAIVED") {
      return NextResponse.json({ error: "This payment is already settled." }, { status: 400 });
    }

    const prefs = await prisma.notificationPreference.findUnique({ where: { userId: payment.userId } });
    if (prefs && !prefs.paymentReminders) {
      return NextResponse.json({ error: "This player has opted out of payment reminders." }, { status: 400 });
    }

    await prisma.notification.create({
      data: {
        userId: payment.userId,
        type: "PAYMENT_REMINDER",
        title: "Payment reminder",
        body: `${payment.label} — ${(payment.amountMinor / 100).toFixed(2)} ${payment.currency} is still outstanding.`,
        link: "/dashboard/payments",
      },
    });

    return NextResponse.json({ success: true });
  });
}
