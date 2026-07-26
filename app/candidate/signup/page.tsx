"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const LEFT_POINTS = [
  "Verified in realistic AI-powered workplace scenarios — not a quiz",
  "Five-dimension DMCS profile you own and carry forward",
  "Employers find you based on verified capability, not keywords",
  "Always free for candidates",
];

export default function CandidateSignup() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Step 1: create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Signup failed. Please try again.");
      setLoading(false);
      return;
    }

    // Step 2: create the matching candidates profile row.
    // id must match auth.users.id — that's the foreign key link in the schema.
    // resume_url/portfolio_url are candidate-provided context only - never
    // read by lib/wse/scoring or lib/wse/ciq, never used in matching.
    const { error: profileError } = await supabase.from("candidates").insert({
      id: authData.user.id,
      display_name: displayName,
      email,
      resume_url: resumeUrl.trim() || null,
      portfolio_url: portfolioUrl.trim() || null,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.push("/candidate/dashboard");
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-brand-bg px-8 py-12 lg:px-16 lg:py-16">
        <div>
          <span className="label-mono text-brand-dark">DOSSYR</span>
          <h1 className="mt-8 text-3xl leading-tight text-ink lg:text-4xl">
            Prove your skills once.
            <br />
            <span className="italic text-brand-dark">Let every employer see the proof.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/80">
            Complete one AI-powered workplace session. Your verified capability profile is yours
            to keep — and travels to every employer on Dossyr. No more repeating the same coding
            tests for every company. No more starting from scratch.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {LEFT_POINTS.map((point) => (
              <li key={point} className="flex gap-2.5 text-sm text-ink">
                <span className="text-brand-dark">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="label-mono mt-10 text-brand-dark">Dossyr · Software Engineering · V1</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12 lg:px-16">
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
          <h2 className="text-2xl text-ink">Create your candidate account</h2>
          <p className="-mt-2 text-sm text-muted">
            Already have an account?{" "}
            <Link href="/candidate/login" className="font-medium text-brand hover:underline">
              Sign in
            </Link>
          </p>

          <label className="mt-2 flex flex-col gap-1.5 text-sm text-ink">
            Full name
            <input
              className="input"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-ink">
            Work email
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-ink">
            Domain
            <select className="input" disabled defaultValue="Software Engineering">
              <option>Software Engineering</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-ink">
            Password
            <input
              className="input"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account & get started →"}
          </button>

          <div className="mt-2 rounded-lg border border-border bg-surface-raised p-4">
            <span className="label-mono">Optional — add right away or later from your dashboard</span>
            <label className="mt-3 flex flex-col gap-1.5 text-sm text-ink">
              Resume / CV <span className="font-normal text-muted">(PDF link or paste URL)</span>
              <input
                className="input"
                type="url"
                placeholder="https://your-resume.com/resume.pdf"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
              />
            </label>
            <label className="mt-3 flex flex-col gap-1.5 text-sm text-ink">
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
            <p className="mt-3 text-xs leading-relaxed text-muted">
              These appear on your Prooffile as candidate-provided context — not used in scoring
              or Discovery ranking. You can update these at any time from your dashboard.
            </p>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            By creating an account you agree to our Terms of Service and Privacy Policy. Dossyr
            is always free for candidates.
          </p>

          <p className="mt-2 text-center text-sm text-muted">
            Are you hiring?{" "}
            <Link href="/employer/signup" className="font-medium text-brand hover:underline">
              Employer sign up →
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
