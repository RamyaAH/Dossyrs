import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
        <span className="label-mono mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1.5">
          <span className="dot bg-brand" />
          Verified skill profiles
        </span>

        <h1 className="text-5xl leading-[1.1] text-ink sm:text-6xl">
          Hiring, proven — <span className="italic text-accent">not claimed.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Dossyr replaces resume-led guessing with a verified capability profile,
          built from real engineering scenarios — not keywords, not pedigree.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/candidate/login" className="btn-primary">
            Candidate Login
          </Link>
          <Link href="/employer/login" className="btn-secondary">
            Employer Login
          </Link>
        </div>
      </div>
    </main>
  );
}
