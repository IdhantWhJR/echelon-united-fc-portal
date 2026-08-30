function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function WelcomeHeader({ firstName, summary }: { firstName: string; summary: string }) {
  const greeting = getGreeting(new Date().getHours());
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">
        {greeting}, {firstName}.
      </h1>
      <p className="mt-1 text-sm text-paper-faint">{summary}</p>
    </div>
  );
}
