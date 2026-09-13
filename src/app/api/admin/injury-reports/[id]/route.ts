import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { injuryStatusUpdateSchema } from "@/lib/validation";

// PATCH /api/admin/injury-reports/[id]  { status, coachNotes? }
// Staff-only: move an injury through REPORTED -> ASSESSING -> RECOVERING -> CLEARED.
// Clearing an injury also restores the player's status to ACTIVE unless they
// were separately marked SUSPENDED or ON_LOAN, which this must not override.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const parsed = injuryStatusUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const existing = await prisma.injuryReport.findUnique({
      where: { id: params.id },
      include: { playerProfile: { select: { id: true, status: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Injury report not found." }, { status: 404 });

    const report = await prisma.$transaction(async (tx) => {
      const updated = await tx.injuryReport.update({
        where: { id: params.id },
        data: { status: parsed.data.status, coachNotes: parsed.data.coachNotes },
      });

      if (parsed.data.status === "CLEARED" && existing.playerProfile.status === "INJURED") {
        await tx.playerProfile.update({
          where: { id: existing.playerProfile.id },
          data: { status: "ACTIVE" },
        });
      }

      await tx.notification.create({
        data: {
          userId: existing.userId,
          type: "GENERAL",
          title: parsed.data.status === "CLEARED" ? "You're cleared to return" : "Injury status updated",
          body:
            parsed.data.status === "CLEARED"
              ? "Your coach has cleared you to return to training."
              : `Your injury report status is now ${parsed.data.status.toLowerCase()}.`,
          link: "/dashboard/wellness",
        },
      });

      return updated;
    });

    return NextResponse.json({ report });
  });
}
