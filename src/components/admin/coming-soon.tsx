import { Icon } from "@/components/icons";

/**
 * Used by admin sections whose schema/guards exist but whose UI hasn't been
 * built yet (see README roadmap). Deliberately not a broken 404 or a raw
 * "TODO" — it names the section, confirms the data model is ready, and
 * tells the admin what's next, matching the spec's empty-state rules.
 *
 * Renders an <h1> because it is currently only ever used as the entire
 * content of a page (see admin/settings) — it IS the page's top-level
 * heading, not a subsection of one. If a future caller ever places this
 * alongside other page content under its own <h1>, this should take a
 * `headingLevel` prop instead of assuming h1.
 */
export function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-center rounded-lg border border-dashed border-line bg-ink-800/40 px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-ink-700 text-gold">
        <Icon name={icon} width={24} height={24} />
      </div>
      <p className="eyebrow mb-2">Coming soon</p>
      <h1 className="mb-2 font-display text-xl font-bold text-paper">{title}</h1>
      <p className="max-w-md text-sm leading-relaxed text-paper-faint">{description}</p>
    </div>
  );
}
