import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { DocumentFormToggle } from "@/components/admin/document-form-toggle";
import { DeleteDocumentButton } from "@/components/admin/delete-document-button";
import { DownloadDocumentButton } from "@/components/documents/download-document-button";

const CATEGORY_LABELS: Record<string, string> = {
  TEAM_RULES: "Team Rules",
  CODE_OF_CONDUCT: "Code of Conduct",
  TRAINING_GUIDELINES: "Training Guidelines",
  NUTRITION_GUIDE: "Nutrition Guide",
  FORMS: "Forms",
  POLICIES: "Policies",
  OTHER: "Other",
};

export default async function AdminDocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Content</p>
          <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Documents</h1>
          <p className="mt-1 text-sm text-paper-faint">
            {documents.length} uploaded · files are stored securely and served through short-lived download links.
          </p>
        </div>
        <DocumentFormToggle />
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <Icon name="file" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No documents uploaded yet.</p>
          <p className="mt-1 text-xs text-paper-faint">Upload the first one — it will show up in every player's Documents tab.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <article key={doc.id} className="card flex items-start justify-between gap-3 p-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-ink-700 text-gold">
                  <Icon name="file" width={16} height={16} />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="badge border-line text-paper-faint">{CATEGORY_LABELS[doc.category] ?? doc.category}</span>
                    {doc.restrictedToCoachesOnly && (
                      <span className="badge border-gold-deep/50 text-gold">
                        <Icon name="lock" width={11} height={11} />
                        Staff only
                      </span>
                    )}
                  </div>
                  <p className="truncate font-display text-base font-bold text-paper">{doc.title}</p>
                  {doc.description && (
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-paper-dim">{doc.description}</p>
                  )}
                  <p className="mt-2 text-xs text-paper-faint">
                    By {doc.uploadedBy.name} · {format(doc.createdAt, "d MMM yyyy")}
                    {doc.fileName ? ` · ${doc.fileName}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <DownloadDocumentButton documentId={doc.id} title={doc.title} />
                <DeleteDocumentButton documentId={doc.id} title={doc.title} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
