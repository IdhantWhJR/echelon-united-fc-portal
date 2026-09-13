import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { documentCreateSchema } from "@/lib/validation";

export async function GET() {
  return withErrorHandling(async () => {
    await requireStaff();
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { name: true } } },
    });
    return NextResponse.json({ documents });
  });
}

// POST /api/admin/documents
// Staff-only. Creates the Document row referencing a file already uploaded
// via /api/upload/document — this route never accepts raw file bytes.
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireStaff();
    const parsed = documentCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const document = await prisma.document.create({
      data: {
        title: data.title,
        category: data.category,
        description: data.description || null,
        restrictedToCoachesOnly: data.restrictedToCoachesOnly ?? false,
        fileUrl: data.filePath,
        fileName: data.fileName,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  });
}
