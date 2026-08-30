import { createClient } from "@supabase/supabase-js";

/**
 * File storage for Documents (and future Learning Hub / Video Library /
 * Chat attachments). Backed by Supabase Storage.
 *
 * Requires in .env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (server-only — never expose to the client)
 *   SUPABASE_STORAGE_BUCKET     (defaults to "echelon-documents")
 *
 * The bucket should be created once in the Supabase dashboard
 * (Storage → New bucket). It can be private — this app always serves
 * files through signed URLs, never a public bucket URL, so access still
 * goes through requireSession()/requireStaff() in the API routes below.
 */

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "echelon-documents";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/** Maximum upload size for documents (25MB — PDFs, docs, images). */
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
];

/**
 * Uploads a file buffer to the documents path in Supabase Storage and
 * returns the storage object path (NOT a public URL — documents are
 * accessed via short-lived signed URLs generated on demand).
 */
export async function uploadDocumentFile(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}): Promise<{ path: string }> {
  const supabase = getClient();
  const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `documents/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, params.buffer, {
    contentType: params.contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return { path };
}

/** Generates a signed, time-limited URL for downloading a stored document. */
export async function getSignedDocumentUrl(path: string, expiresInSeconds = 60 * 10) {
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) {
    throw new Error(`Could not create signed URL: ${error?.message ?? "unknown error"}`);
  }

  return data.signedUrl;
}

/** Deletes a stored document (used when an admin removes a document). */
export async function deleteDocumentFile(path: string) {
  const supabase = getClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
