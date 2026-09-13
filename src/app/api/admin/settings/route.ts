import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, withErrorHandling } from "@/lib/guard";
import { clubSettingsUpdateSchema } from "@/lib/validation";

// GET /api/admin/settings
// Admin-only. Returns the single ClubSettings row, creating it with
// defaults on first read (there is never more than one row — id is
// pinned to "club").
export async function GET() {
  return withErrorHandling(async () => {
    await requireAdmin();

    const settings = await prisma.clubSettings.upsert({
      where: { id: "club" },
      update: {},
      create: { id: "club" },
    });

    return NextResponse.json({ settings });
  });
}

// PATCH /api/admin/settings
// Admin-only (not coach — this is club-wide config, not day-to-day
// coaching work). Updates the single ClubSettings row.
export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireAdmin();
    const parsed = clubSettingsUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const { clubName, contactEmail, timezone } = parsed.data;

    const settings = await prisma.clubSettings.upsert({
      where: { id: "club" },
      update: { clubName, contactEmail: contactEmail || null, timezone },
      create: { id: "club", clubName, contactEmail: contactEmail || null, timezone },
    });

    return NextResponse.json({ settings });
  });
}
