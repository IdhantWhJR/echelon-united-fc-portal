import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { DownloadDocumentButton } from "@/components/documents/download-document-button";
import { Role } from "@prisma/client";

const CATEGORY_LABELS: Record<string, string> = {
  TEAM_RULES: "Team Rules",
  CODE_OF_CONDUCT: "Code of Conduct",
  TRAINING_GUIDELINES: "Training Guidelines",
  NUTRITION_GUIDE: "Nutrition Guide",
  FORMS: "Forms",
  POLICIES: "Policies",
  OTHER: "Other",
};

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isStaff = session.user.role === Role.COACH || session.user.role === Role.ADMIN;

  const documents = await prisma.document.findMany({
    where: isStaff ? {} : { restrictedToCoachesOnly: false },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Resources</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Documents</h1>
        <p className="mt-1 text-sm text-paper-faint">Team rules, guides, and forms shared by the club.</p>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <Icon name="file" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No documents yet.</p>
          <p className="mt-1 text-xs text-paper-faint">Anything the club uploads will appear here.</p>
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
                  <p className="mt-2 text-xs text-paper-faint">{format(doc.createdAt, "d MMM yyyy")}</p>
                </div>
              </div>
              <div className="shrink-0">
                <DownloadDocumentButton documentId={doc.id} title={doc.title} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
