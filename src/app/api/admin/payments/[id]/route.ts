import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { paymentStatusUpdateSchema } from "@/lib/validation";

// PATCH /api/admin/payments/[id]
// Staff-only. Updates a payment's status. Marking PAID here is a manual
// record of payment received (cash/bank transfer/in person) — there is no
// live payment processor wired up, so this never represents an automated
// charge confirmation, per the spec's rule not to fake a completed payment.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const parsed = paymentStatusUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const existing = await prisma.payment.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        paidAt: parsed.data.status === "PAID" ? new Date() : parsed.data.status === "UNPAID" ? null : existing.paidAt,
      },
    });

    return NextResponse.json({ payment });
  });
}

// DELETE /api/admin/payments/[id]
// Staff-only. Removes a payment record entirely (e.g. created in error).
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const existing = await prisma.payment.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    await prisma.payment.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  });
}
