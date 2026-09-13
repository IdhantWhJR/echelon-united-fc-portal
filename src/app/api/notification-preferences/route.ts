import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling } from "@/lib/guard";
import { notificationPreferencesSchema } from "@/lib/validation";

// GET /api/notification-preferences — the signed-in user's own row, created
// lazily if it somehow doesn't exist yet (it's normally created at signup).
export async function GET() {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
    });
    return NextResponse.json({ preferences: prefs });
  });
}

// PATCH /api/notification-preferences — partial update, own row only.
export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const parsed = notificationPreferencesSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: parsed.data,
      create: { userId: session.user.id, ...parsed.data },
    });
    return NextResponse.json({ preferences: prefs });
  });
}
