import { NextRequest, NextResponse } from "next/server";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, uploadDocumentFile } from "@/lib/storage";

// POST /api/upload/document
// Staff-only (documents are admin-authored per the spec). Accepts a
// multipart/form-data body with a single "file" field, uploads it to
// Supabase Storage, and returns the storage path — the client then submits
// that path (not a raw file) to /api/admin/documents to create the row.
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireStaff();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty." }, { status: 400 });
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 25MB." },
        { status: 400 }
      );
    }
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF, Word/Excel doc, image, or text file." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const { path } = await uploadDocumentFile({
        buffer,
        fileName: file.name,
        contentType: file.type,
      });
      return NextResponse.json({ path, fileName: file.name }, { status: 201 });
    } catch (err) {
      console.error(err);
      return NextResponse.json(
        {
          error:
            "Upload failed. Check that SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and the storage bucket are configured.",
        },
        { status: 502 }
      );
    }
  });
}
