import { SVGProps } from "react";

// A small hand-picked stroke-icon set so the app has zero dependency on an
// external icon package. Every icon shares the same stroke width and corner
// treatment so the set reads as one family.
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type IconProps = SVGProps<SVGSVGElement>;

export function Icon({ name, ...props }: { name: string } & IconProps) {
  const paths: Record<string, JSX.Element> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    activity: <path d="M22 12h-4l-3 9-6-18-3 9H2" />,
    trending: (
      <>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </>
    ),
    shield: <path d="M12 2l8 3v6c0 5-3.4 8.5-8 11-4.6-2.5-8-6-8-11V5z" />,
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
        <circle cx="18" cy="9" r="2.6" />
        <path d="M15.7 14.3c2.9.4 4.8 2.5 4.8 5.7" />
      </>
    ),
    heart: <path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.3 4.5 6 4c2-.3 3.7.6 6 3 2.3-2.4 4-3.3 6-3 3.7.5 5.6 4.1 4 7.7C19.5 16.4 12 21 12 21z" />,
    video: (
      <>
        <rect x="2" y="5" width="14" height="14" rx="2" />
        <path d="M16 9.5l6-3v11l-6-3z" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
      </>
    ),
    chat: <path d="M21 12a8 8 0 11-3.4-6.5L21 4l-1 4.6A7.9 7.9 0 0121 12z" />,
    poll: (
      <>
        <path d="M6 20V10M12 20V4M18 20v-7" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 01-8 0V4z" />
        <path d="M8 4H4v2a4 4 0 004 4M16 4h4v2a4 4 0 01-4 4" />
        <path d="M12 13v4M9 21h6M9 21c0-1.6.7-2.6 1.5-3M15 21c0-1.6-.7-2.6-1.5-3" />
      </>
    ),
    medal: (
      <>
        <circle cx="12" cy="15" r="6" />
        <path d="M9 3l3 5 3-5M8.5 8L6 3M15.5 8L18 3" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </>
    ),
    bell: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />,
    chevronDown: <path d="M6 9l6 6 6-6" />,
    logout: (
      <>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <path d="M16 17l5-5-5-5M21 12H9" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="M20 6L9 17l-5-5" />,
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
      </>
    ),
    scale: (
      <>
        <path d="M12 3v18M5 8l-3 6a3.5 3.5 0 007 0zM19 8l-3 6a3.5 3.5 0 007 0zM5 8h14M3 21h18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
    mapPin: (
      <>
        <path d="M12 21s7-6.3 7-12a7 7 0 10-14 0c0 5.7 7 12 7 12z" />
        <circle cx="12" cy="9" r="2.5" />
      </>
    ),
    alert: (
      <>
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.3 3.9L2.5 18a1.6 1.6 0 001.4 2.4h16.2a1.6 1.6 0 001.4-2.4L13.7 3.9a1.6 1.6 0 00-2.8 0z" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </>
    ),
    cash: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M6 6v0M18 18v0" />
      </>
    ),
    clipboard: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
        <path d="M8.5 11h7M8.5 15h7M8.5 19h4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
      </>
    ),
    x: <path d="M18 6L6 18M6 6l12 12" />,
    arrowLeft: <path d="M19 12H5M11 18l-6-6 6-6" />,
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v13M7 11l5 5 5-5" />
        <path d="M4 21h16" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 018 0v3" />
      </>
    ),
  };

  return (
    <svg width={18} height={18} viewBox="0 0 24 24" {...base} {...props}>
      {paths[name] ?? paths.grid}
    </svg>
  );
}
