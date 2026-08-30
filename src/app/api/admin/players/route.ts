import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { adminCreatePlayerSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireStaff();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const squadId = searchParams.get("squadId");
    const position = searchParams.get("position");
    const status = searchParams.get("status");

    const players = await prisma.playerProfile.findMany({
      where: {
        ...(squadId ? { squadId } : {}),
        ...(position ? { position: position as any } : {}),
        ...(status ? { status: status as any } : {}),
        ...(q
          ? {
              user: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, isActive: true, avatarUrl: true } },
        squad: { select: { id: true, name: true } },
      },
      orderBy: [{ jerseyNumber: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ players });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireStaff();
    const body = await req.json();
    const parsed = adminCreatePlayerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const data = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: "PLAYER",
        playerProfile: {
          create: {
            jerseyNumber: data.jerseyNumber,
            position: data.position,
            preferredFoot: data.preferredFoot,
            heightCm: data.heightCm,
            squadId: data.squadId ?? undefined,
            status: data.status ?? "ACTIVE",
            bio: data.bio,
          },
        },
        notificationPrefs: { create: {} },
      },
      include: { playerProfile: true },
    });

    return NextResponse.json({ player: user }, { status: 201 });
  });
}
