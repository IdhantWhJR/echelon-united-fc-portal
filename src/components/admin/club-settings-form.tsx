"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ClubSettings = {
  clubName: string;
  contactEmail: string | null;
  timezone: string;
};

// A short, common list rather than every IANA zone — keeps the select
// usable. "Other" lets an admin type a custom IANA zone if theirs isn't
// listed, since the schema field itself just stores a plain string.
const COMMON_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
];

export function ClubSettingsForm({ settings }: { settings: ClubSettings }) {
  const router = useRouter();
  const [clubName, setClubName] = useState(settings.clubName);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail ?? "");
  const [timezone, setTimezone] = useState(settings.timezone);
  const [customTimezone, setCustomTimezone] = useState(
    COMMON_TIMEZONES.includes(settings.timezone) ? "" : settings.timezone
  );
  const [usingCustomTz, setUsingCustomTz] = useState(!COMMON_TIMEZONES.includes(settings.timezone));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);

    const finalTimezone = usingCustomTz ? customTimezone.trim() : timezone;

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clubName, contactEmail, timezone: finalTimezone }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save settings.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-5 lg:p-6">
      {error && (
        <p className="rounded-md border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="rounded-md border border-pitch-green/30 bg-pitch-green/10 px-3 py-2 text-sm text-pitch-green">
          Settings saved.
        </p>
      )}

      <div>
        <label htmlFor="clubName" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-paper-faint">
          Club name
        </label>
        <input
          id="clubName"
          type="text"
          required
          minLength={2}
          maxLength={80}
          value={clubName}
          onChange={(e) => {
            setClubName(e.target.value);
            setSaved(false);
          }}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="contactEmail" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-paper-faint">
          Contact email <span className="normal-case text-paper-faint/70">(optional)</span>
        </label>
        <input
          id="contactEmail"
          type="email"
          maxLength={255}
          placeholder="club@echelonunited.com"
          value={contactEmail}
          onChange={(e) => {
            setContactEmail(e.target.value);
            setSaved(false);
          }}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="timezone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-paper-faint">
          Club timezone
        </label>
        <select
          id="timezone"
          value={usingCustomTz ? "OTHER" : timezone}
          onChange={(e) => {
            setSaved(false);
            if (e.target.value === "OTHER") {
              setUsingCustomTz(true);
            } else {
              setUsingCustomTz(false);
              setTimezone(e.target.value);
            }
          }}
          className="input-field"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
          <option value="OTHER">Other (enter manually)</option>
        </select>
        {usingCustomTz && (
          <input
            type="text"
            required
            placeholder="e.g. Europe/Lisbon"
            value={customTimezone}
            onChange={(e) => {
              setCustomTimezone(e.target.value);
              setSaved(false);
            }}
            className="input-field mt-2"
          />
        )}
        <p className="mt-1.5 text-xs text-paper-faint">
          Used for displaying event and match times consistently. Enter a standard IANA timezone name.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
