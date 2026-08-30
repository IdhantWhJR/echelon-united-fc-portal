"use client";

import { cloneElement, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

const CATEGORIES = [
  { value: "TEAM_RULES", label: "Team Rules" },
  { value: "CODE_OF_CONDUCT", label: "Code of Conduct" },
  { value: "TRAINING_GUIDELINES", label: "Training Guidelines" },
  { value: "NUTRITION_GUIDE", label: "Nutrition Guide" },
  { value: "FORMS", label: "Forms" },
  { value: "POLICIES", label: "Policies" },
  { value: "OTHER", label: "Other" },
];

export function DocumentForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [description, setDescription] = useState("");
  const [restrictedToCoachesOnly, setRestrictedToCoachesOnly] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("/api/upload/document", { method: "POST", body: formData });
    const uploadData = await uploadRes.json().catch(() => ({}));

    if (!uploadRes.ok) {
      setSubmitting(false);
      setError(uploadData.error ?? "Upload failed.");
      return;
    }

    const createRes = await fetch("/api/admin/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        description,
        restrictedToCoachesOnly,
        filePath: uploadData.path,
        fileName: uploadData.fileName,
      }),
    });
    setSubmitting(false);

    if (!createRes.ok) {
      const data = await createRes.json().catch(() => ({}));
      setError(data.error ?? "Could not save document.");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <form onSubmit={submit} className="card animate-rise-in space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input
            required
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Pre-season fitness guidelines"
          />
        </Field>
        <Field label="Category">
          <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description (optional)">
        <textarea
          className="input-field min-h-20 resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this document is and when to use it…"
        />
      </Field>

      <div>
        <label htmlFor="document-file" className="mb-1 block text-xs text-paper-dim">
          File
        </label>
        <input
          id="document-file"
          ref={fileInputRef}
          type="file"
          required
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="input-field cursor-pointer file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-paper hover:file:bg-ink-600"
        />
        <p className="mt-1 text-[11px] text-paper-faint">
          PDF, Word, Excel, image, or text file — up to 25MB.{fileName ? ` Selected: ${fileName}` : ""}
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-paper-dim">
        <input
          type="checkbox"
          checked={restrictedToCoachesOnly}
          onChange={(e) => setRestrictedToCoachesOnly(e.target.checked)}
          className="accent-gold"
        />
        Restrict to coaches and admins only
      </label>

      {error && <p className="text-sm text-signal-danger">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={submitting} className="btn-primary text-xs">
          <Icon name="upload" width={14} height={14} />
          {submitting ? "Uploading…" : "Upload document"}
        </button>
        <button type="button" onClick={onClose} className="text-xs font-medium text-paper-faint hover:text-paper">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs text-paper-dim">{label}</label>
      {cloneElement(children, { id })}
    </div>
  );
}
