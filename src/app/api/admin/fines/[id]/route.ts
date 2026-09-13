import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { fineStatusUpdateSchema } from "@/lib/validation";

// PATCH /api/admin/fines/[id]  { status: "UNPAID" | "PAID" | "WAIVED" }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const parsed = fineStatusUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const fine = await prisma.fine.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        paidAt: parsed.data.status === "PAID" ? new Date() : null,
      },
    });

    return NextResponse.json({ fine });
  });
}

// DELETE /api/admin/fines/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    await prisma.fine.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
