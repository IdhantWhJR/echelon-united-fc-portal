import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { deleteDocumentFile } from "@/lib/storage";

// DELETE /api/admin/documents/[id]
// Staff-only. Deletes the DB row and best-effort deletes the underlying
// storage object (if the storage delete fails — e.g. storage not configured
// in this environment — we still remove the row rather than leaving a
// broken document listed, and log the storage error for follow-up).
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();

    const document = await prisma.document.findUnique({ where: { id: params.id } });
    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    await prisma.document.delete({ where: { id: params.id } });

    try {
      await deleteDocumentFile(document.fileUrl);
    } catch (err) {
      console.error("Failed to delete storage object for document", document.id, err);
    }

    return NextResponse.json({ success: true });
  });
}
