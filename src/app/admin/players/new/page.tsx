import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { PlayerForm } from "@/components/admin/player-form";

export default async function NewPlayerPage() {
  const squads = await prisma.squad.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/players" className="mb-4 inline-flex items-center gap-2 text-xs text-paper-faint hover:text-gold">
        <Icon name="arrowLeft" width={14} height={14} />
        Back to players
      </Link>
      <p className="eyebrow mb-1">Squad</p>
      <h1 className="mb-1 font-display text-2xl font-bold text-paper">Add a player</h1>
      <p className="mb-6 text-sm text-paper-faint">
        Creates a login for the player with the temporary password below. Share it with them securely — they can
        change it after signing in.
      </p>
      <PlayerForm mode="create" squads={squads} />
    </div>
  );
}
