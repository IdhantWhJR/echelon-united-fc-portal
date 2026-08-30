import { NavItem } from "@/lib/nav-config";

// Every route here has a real page — either fully functional or a polished
// "coming soon" placeholder (see src/components/admin/coming-soon.tsx) so
// the panel never 404s and always feels like a finished shell, per the
// spec's rule that empty/unbuilt sections must never look broken.
export const adminNav: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ label: "Overview", href: "/admin", icon: "grid" }],
  },
  {
    section: "Squad",
    items: [
      { label: "Players", href: "/admin/players", icon: "users" },
      { label: "Squad", href: "/admin/squad", icon: "shield" },
    ],
  },
  {
    section: "Schedule",
    items: [
      { label: "Calendar", href: "/admin/calendar", icon: "calendar" },
      { label: "Matches", href: "/admin/matches", icon: "trophy" },
      { label: "Attendance", href: "/admin/attendance", icon: "check" },
    ],
  },
  {
    section: "Development",
    items: [
      { label: "Training Plans", href: "/admin/training-plans", icon: "activity" },
      { label: "Workouts", href: "/admin/workouts", icon: "clipboard" },
      { label: "Workout Reviews", href: "/admin/workout-reviews", icon: "video" },
      { label: "Performance", href: "/admin/performance", icon: "trending" },
      { label: "Wellness", href: "/admin/wellness", icon: "heart" },
    ],
  },
  {
    section: "Communication",
    items: [
      { label: "Announcements", href: "/admin/announcements", icon: "alert" },
      { label: "Notifications", href: "/admin/notifications", icon: "bell" },
    ],
  },
  {
    section: "Content",
    items: [
      { label: "Documents", href: "/admin/documents", icon: "file" },
    ],
  },
  {
    section: "Recognition",
    items: [
      { label: "Leaderboards", href: "/admin/leaderboards", icon: "medal" },
      { label: "Achievements", href: "/admin/achievements", icon: "trophy" },
    ],
  },
  {
    section: "Club",
    items: [
      { label: "Payments", href: "/admin/payments", icon: "cash" },
      { label: "Settings", href: "/admin/settings", icon: "settings" },
    ],
  },
];

export const adminNavFlat: NavItem[] = adminNav.flatMap((s) => s.items);
