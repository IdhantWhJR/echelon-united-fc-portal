export type NavItem = {
  label: string;
  href: string;
  icon: string; // key mapped to an inline icon in <NavIcon>
};

export const primaryNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "grid" },
  { label: "Calendar", href: "/dashboard/calendar", icon: "calendar" },
  { label: "Training", href: "/dashboard/training", icon: "activity" },
  { label: "Performance", href: "/dashboard/performance", icon: "trending" },
  { label: "Match Center", href: "/dashboard/matches", icon: "shield" },
  { label: "Squad", href: "/dashboard/squad", icon: "users" },
];

export const secondaryNav: NavItem[] = [
  { label: "Notifications", href: "/dashboard/notifications", icon: "bell" },
  { label: "Announcements", href: "/dashboard/announcements", icon: "alert" },
  { label: "Wellness", href: "/dashboard/wellness", icon: "heart" },
  { label: "Payments", href: "/dashboard/payments", icon: "cash" },
  { label: "Documents", href: "/dashboard/documents", icon: "file" },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: "trophy" },
  { label: "Achievements", href: "/dashboard/achievements", icon: "medal" },
  { label: "Account", href: "/dashboard/account", icon: "settings" },
];

// Bottom bar on mobile only surfaces the handful of things used every day.
export const mobileNav: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: "grid" },
  { label: "Calendar", href: "/dashboard/calendar", icon: "calendar" },
  { label: "Training", href: "/dashboard/training", icon: "activity" },
  { label: "Performance", href: "/dashboard/performance", icon: "trending" },
  { label: "More", href: "/dashboard/more", icon: "more" },
];
