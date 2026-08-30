import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling } from "@/lib/guard";
import { selfPasswordChangeSchema } from "@/lib/validation";

// PATCH /api/account/password
// Any signed-in user can change their own password, but only after their
// current password is verified against the stored bcrypt hash — this is not
// an admin reset, it's the account owner proving they still know it.
export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const parsed = selfPasswordChangeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } });

    return NextResponse.json({ message: "Password updated." });
  });
}
