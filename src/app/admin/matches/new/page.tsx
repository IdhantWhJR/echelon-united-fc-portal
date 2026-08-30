import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { MatchForm } from "@/components/admin/match-form";

export default async function NewMatchPage() {
  const squads = await prisma.squad.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/matches" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-paper-faint hover:text-gold">
        <Icon name="arrowLeft" width={13} height={13} />
        Back to Match Center
      </Link>
      <div className="mb-6">
        <p className="eyebrow mb-1">New fixture</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Create match</h1>
        <p className="mt-1 text-sm text-paper-faint">
          This also adds the fixture to the calendar and opens attendance for the squad you pick.
        </p>
      </div>
      <MatchForm squads={squads.map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  );
}
