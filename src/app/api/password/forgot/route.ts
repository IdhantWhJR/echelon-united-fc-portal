import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success even if the user doesn't exist — prevents
  // account enumeration via this endpoint.
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    // TODO: wire up a transactional email provider (Resend, Postmark, SES...)
    // and send a link like `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`.
    // Logging in development so the flow is testable end-to-end without email set up.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] Password reset link for ${email}: /reset-password?token=${resetToken}`);
    }
  }

  return NextResponse.json({
    message: "If an account exists for that email, a reset link has been sent.",
  });
}
