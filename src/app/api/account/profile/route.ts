import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling } from "@/lib/guard";
import { selfProfileUpdateSchema } from "@/lib/validation";

// PATCH /api/account/profile
// Any signed-in user (player or staff) can update their own name, email, and
// phone. This never touches jersey number, position, squad, or status —
// those stay admin-only via /api/admin/players/[id] and this route doesn't
// even accept them, so there's no field to accidentally expose.
export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const parsed = selfProfileUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const { name, email, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail !== session.user.email) {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing && existing.id !== session.user.id) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email: normalizedEmail, phone: phone || null },
      select: { id: true, name: true, email: true, phone: true },
    });

    return NextResponse.json({ user });
  });
}
