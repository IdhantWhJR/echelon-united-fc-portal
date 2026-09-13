"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

type Stat = {
  periodLabel: string;
  goals: number;
  assists: number;
  fitnessScore: number | null;
  coachRating: number | null;
};

export function PerformanceTrendChart({ stats }: { stats: Stat[] }) {
  // Oldest -> newest for a left-to-right trend line.
  const data = [...stats].reverse().map((s) => ({
    period: s.periodLabel,
    Goals: s.goals,
    Assists: s.assists,
    Fitness: s.fitnessScore ?? undefined,
    Rating: s.coachRating != null ? s.coachRating * 10 : undefined, // scale 0-10 to 0-100 to share an axis
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#1C1D20" vertical={false} />
          <XAxis dataKey="period" stroke="#7B7C81" tick={{ fontSize: 11, fill: "#7B7C81" }} tickLine={false} axisLine={{ stroke: "#26272B" }} />
          <YAxis stroke="#7B7C81" tick={{ fontSize: 11, fill: "#7B7C81" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#121315", border: "1px solid #26272B", borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: "#B9B9BC" }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#7B7C81" }} />
          <Line type="monotone" dataKey="Goals" stroke="#D9A62E" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Assists" stroke="#4A7FA6" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Fitness" stroke="#2E7D5B" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
