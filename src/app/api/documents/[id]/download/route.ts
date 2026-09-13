import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling } from "@/lib/guard";
import { getSignedDocumentUrl } from "@/lib/storage";
import { Role } from "@prisma/client";

// GET /api/documents/[id]/download
// Any signed-in user, but coach-restricted documents are blocked for
// players at the API layer (not just hidden in the UI). Returns a
// short-lived signed URL rather than proxying bytes, matching the "signed
// URL, not a public bucket" approach documented in lib/storage.ts.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const session = await requireSession();

    const document = await prisma.document.findUnique({ where: { id: params.id } });
    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const isStaff = session.user.role === Role.COACH || session.user.role === Role.ADMIN;
    if (document.restrictedToCoachesOnly && !isStaff) {
      return NextResponse.json(
        { error: "This document is restricted to coaches and admins." },
        { status: 403 }
      );
    }

    try {
      const url = await getSignedDocumentUrl(document.fileUrl);
      return NextResponse.json({ url, fileName: document.fileName ?? document.title });
    } catch (err) {
      console.error(err);
      return NextResponse.json(
        { error: "Could not generate a download link. Storage may not be configured yet." },
        { status: 502 }
      );
    }
  });
}
