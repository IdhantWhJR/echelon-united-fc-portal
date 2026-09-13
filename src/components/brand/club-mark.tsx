import { clsx } from "clsx";

/**
 * Signature brand element. In place of a commissioned crest, this renders a
 * disciplined text mark inside a hexagonal-cut badge — a nod to a shield
 * silhouette without resorting to a generic clipart crest. Reused as the
 * app's one recurring "signature" motif (login, sidebar, loading states).
 */
export function ClubMark({
  size = "md",
  withWordmark = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
  className?: string;
}) {
  const dims = { sm: 32, md: 40, lg: 64 }[size];

  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <svg
        width={dims}
        height={dims}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M32 2 L59 15 V41 L32 62 L5 41 V15 Z"
          fill="#0B0C0D"
          stroke="url(#gold-edge)"
          strokeWidth="1.5"
        />
        <path
          d="M32 8 L53 18 V39 L32 55 L11 39 V18 Z"
          fill="none"
          stroke="#26272B"
          strokeWidth="1"
        />
        <text
          x="32"
          y="39"
          textAnchor="middle"
          fontFamily="var(--font-display), sans-serif"
          fontWeight="700"
          fontSize="22"
          fill="#D9A62E"
          letterSpacing="0.5"
        >
          EU
        </text>
        <defs>
          <linearGradient id="gold-edge" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="#F2C94C" />
            <stop offset="100%" stopColor="#A97D1F" />
          </linearGradient>
        </defs>
      </svg>
      {withWordmark && (
        <div className="leading-none">
          <div className="font-display text-lg font-bold uppercase tracking-wide text-paper">
            Echelon United
          </div>
          <div className="font-display text-[10px] font-semibold uppercase tracking-widest2 text-gold">
            Football Club
          </div>
        </div>
      )}
    </div>
  );
}
