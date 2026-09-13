import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * Every API route that touches sensitive data must call one of these guards
 * FIRST, before reading the request body or hitting the database. Hiding a
 * button in the UI is not access control — this is the actual boundary.
 */

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Returns the session or throws a 401. Use in every protected route. */
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new AuthError("You must be signed in.", 401);
  return session;
}

/** Returns the session only if the user's role is in `roles`, else throws 403. */
export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new AuthError("You do not have permission to do this.", 403);
  }
  return session;
}

/** Shorthand: coach or admin only. Used for every write to performance,
 *  workout verification, attendance overrides, announcements, etc. */
export async function requireStaff() {
  return requireRole([Role.COACH, Role.ADMIN]);
}

/** Shorthand: admin only. Used for user management and destructive actions. */
export async function requireAdmin() {
  return requireRole([Role.ADMIN]);
}

/**
 * Confirms the signed-in player owns the given playerProfileId, OR the
 * signed-in user is staff. Used for endpoints where a player may act on
 * their own data (e.g. submit a workout video, log weight, report wellness)
 * but must never act on someone else's.
 */
export async function requireOwnerOrStaff(playerProfileId: string) {
  const session = await requireSession();
  if (session.user.role === Role.COACH || session.user.role === Role.ADMIN) {
    return session;
  }
  const owns = await prisma.playerProfile.findFirst({
    where: { id: playerProfileId, userId: session.user.id },
    select: { id: true },
  });
  if (!owns) {
    throw new AuthError("You do not have permission to modify this record.", 403);
  }
  return session;
}

/** Wraps a route handler body so AuthError becomes a clean JSON response. */
export function withErrorHandling(fn: () => Promise<NextResponse>) {
  return fn().catch((err) => {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  });
}
