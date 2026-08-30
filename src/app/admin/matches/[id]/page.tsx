import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Icon } from "@/components/icons";
import { MatchEditor } from "@/components/admin/match-editor";
import { AppearanceEditor } from "@/components/admin/appearance-editor";
import { AttendanceSummary } from "@/components/admin/attendance-summary";
import { DeleteMatchButton } from "@/components/admin/delete-match-button";

export default async function AdminMatchDetailPage({ params }: { params: { id: string } }) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      event: { include: { attendanceRecords: true, squad: true } },
      appearances: true,
    },
  });
  if (!match) notFound();

  const players = await prisma.playerProfile.findMany({
    where: match.event?.squadId ? { squadId: match.event.squadId } : {},
    include: { user: { select: { name: true } } },
    orderBy: [{ jerseyNumber: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/matches" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-paper-faint hover:text-gold">
        <Icon name="arrowLeft" width={13} height={13} />
        Back to Match Center
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow mb-1">
            {format(match.date, "EEEE, MMMM d, yyyy")} · {format(match.kickoff, "h:mm a")}
          </p>
          <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">
            Echelon United <span className="text-paper-faint">{match.homeAway === "HOME" ? "vs" : "@"}</span> {match.opponent}
          </h1>
          <p className="mt-1 text-sm text-paper-faint">
            {match.venue ?? "Venue TBC"}
            {match.competition ? ` · ${match.competition}` : ""}
            {match.event?.squad ? ` · ${match.event.squad.name}` : " · Whole club"}
          </p>
        </div>
        <DeleteMatchButton matchId={match.id} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MatchEditor
          match={{
            id: match.id,
            status: match.status,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            matchReport: match.matchReport,
            homeAway: match.homeAway,
          }}
        />

        <div className="card p-5 lg:p-6">
          <p className="eyebrow mb-3">Attendance</p>
          {match.event ? (
            <AttendanceSummary records={match.event.attendanceRecords} />
          ) : (
            <p className="text-sm text-paper-faint">No calendar entry linked to this match.</p>
          )}
          <Link href="/admin/attendance" className="mt-4 inline-block text-xs font-semibold text-gold hover:underline">
            Manage individual responses →
          </Link>
        </div>
      </div>

      <div className="mt-5">
        {players.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-12 text-center">
            <Icon name="users" width={20} height={20} className="mb-2 text-paper-faint" />
            <p className="text-sm text-paper-faint">No players in the targeted squad yet.</p>
          </div>
        ) : (
          <AppearanceEditor
            matchId={match.id}
            players={players.map((p) => ({ id: p.id, name: p.user.name, jerseyNumber: p.jerseyNumber }))}
            appearances={match.appearances.map((a) => ({
              playerProfileId: a.playerProfileId,
              role: a.role,
              minutesPlayed: a.minutesPlayed,
              goals: a.goals,
              assists: a.assists,
              yellowCards: a.yellowCards,
              redCards: a.redCards,
              ratingOutOf10: a.ratingOutOf10,
            }))}
          />
        )}
      </div>
    </div>
  );
}
