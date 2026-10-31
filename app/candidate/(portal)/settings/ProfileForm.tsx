"use client";

import { useState } from "react";

export function ProfileForm({
  initialResumeUrl,
  initialPortfolioUrl,
}: {
  initialResumeUrl: string | null;
  initialPortfolioUrl: string | null;
}) {
  const [resumeUrl, setResumeUrl] = useState(initialResumeUrl ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(initialPortfolioUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/candidate/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeUrl, portfolioUrl }),
    });

    setSaving(false);
    if (!res.ok) {
      setError("Something went wrong saving these links. Please try again.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm text-ink">
        Resume / CV <span className="font-normal text-muted">(PDF link or paste URL)</span>
        <input
          className="input"
          type="url"
          placeholder="https://your-resume.com/resume.pdf"
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-ink">
        Portfolio / Project link{" "}
        <span className="font-normal text-muted">(GitHub, personal site, etc.)</span>
        <input
          className="input"
          type="url"
          placeholder="https://github.com/yourname"
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
        />
      </label>
      <p className="text-xs leading-relaxed text-muted">
        These appear on your Prooffile as candidate-provided context — not used in scoring or
        Discovery ranking.
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button className="btn-primary self-start" type="submit" disabled={saving}>
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
      </button>
    </form>
  );
}
