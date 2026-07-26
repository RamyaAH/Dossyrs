import Link from "next/link";

const LOOP_STEPS = [
  {
    n: "01",
    name: "Measure",
    desc: "AI-powered workplace simulations with real scenarios and seven AI team personas. Adaptive per session. Impossible to game.",
  },
  {
    n: "02",
    name: "Verify",
    desc: "Integrity signals and a full audit trail on every session. Clean · Review · Compromised. Transparent from the first view.",
  },
  {
    n: "03",
    name: "Match",
    desc: "Verified profiles surface to employers who match. Candidates signal interest in companies they want. Both sides move with intention.",
  },
  {
    n: "04",
    name: "Confirm",
    desc: "Post-hire check-ins close the loop. Outcomes feed back in. Every confirmed hire makes the next one more accurate.",
  },
];

const EMPLOYER_BENEFITS = [
  "Work simulations replace weeks of screening rounds. Shortlist the same day",
  "Five-dimensional DMCS capability profile, not a pass/fail score",
  "AI team personas reveal how candidates handle real interpersonal pressure",
  "Integrity signals on every session: Clean, Review, or Compromised",
  "Post-hire outcomes feed back in. Hiring improves with every confirmed hire",
];

const CANDIDATE_BENEFITS = [
  "Assessed on real work scenarios with AI team dynamics, not abstract algorithm puzzles",
  "Complete the simulation once. Your verified profile travels to every employer. No more company-specific coding tests repeated from scratch.",
  "Evaluated purely on what you can do, not where you went to school or who you've worked for before",
  "Browse companies actively hiring and signal genuine interest. You choose who sees you, with intention",
  "Get discovered by employers whose role requirements match your verified DMCS profile",
  "Show your whole self. Attach technical work, music, writing, art, or anything you've made to your verified profile",
  "Receive a personalised benchmark report. See exactly where you rank across all five dimensions and what each score means for your next career move",
];

const CREATE_TYPES = [
  "Repository",
  "Live project",
  "Music",
  "Visual art",
  "Writing",
  "Dance",
  "Photography",
  "Video / Film",
];

export default function Home() {
  return (
    <main className="bg-surface">
      <header className="mx-auto flex max-w-5xl items-center px-6 py-8">
        <span className="label-mono text-ink">DOSSYR</span>
      </header>

      {/* Hero */}
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-20 pt-4 text-center">
        <span className="label-mono mb-6 max-w-xl text-balance normal-case tracking-normal text-muted">
          Where employers find better hires. Candidates find better careers.
        </span>

        <h1 className="text-4xl leading-[1.15] text-ink sm:text-5xl">
          Every hire. Every career.
          <br />
          <span className="italic text-accent">Finally, the intelligence to get both right.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Employers spend months in interview cycles and still make the wrong hire. Candidates
          repeat the same broken process for every company: abstract tests, no feedback, no
          portable proof of what they can do.{" "}
          <span className="font-semibold text-ink">Dossyr is built for both sides.</span>
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/candidate/signup" className="btn-primary">
            Candidate signup
          </Link>
          <Link href="/employer/signup" className="btn-secondary">
            Employer signup
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="border-y border-border bg-surface-raised">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <span className="label-mono block text-center text-muted">The problem today</span>
          <div className="mt-5 grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
            <div>
              <div className="text-3xl text-ink">6-8 wks</div>
              <div className="mt-1 text-sm text-muted">
                Average time spent hiring a single software engineer
              </div>
            </div>
            <div>
              <div className="text-3xl text-ink">46%</div>
              <div className="mt-1 text-sm text-muted">
                Of applications contain significant embellishments
              </div>
            </div>
            <div>
              <div className="text-3xl text-ink">$150K</div>
              <div className="mt-1 text-sm text-muted">
                Average cost of a single mis-hire in software engineering
              </div>
            </div>
          </div>

          <div className="mx-auto my-8 h-px w-16 bg-border" />

          <span className="label-mono block text-center text-brand">With Dossyr</span>
          <div className="mt-5 grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
            <div className="text-base font-semibold text-ink">Shortlist in days, not weeks.</div>
            <div className="text-base font-semibold text-ink">Verified, not self-reported.</div>
            <div className="text-base font-semibold text-ink">
              Confirmed early, not discovered late.
            </div>
          </div>
        </div>
      </div>

      {/* How Dossyr works */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <span className="label-mono">How Dossyr works</span>
        <h2 className="mt-3 max-w-2xl text-3xl text-ink">
          A verified loop, from simulation to confirmed outcome.
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Four connected steps that finally link what candidates can do with whether the hire
          actually worked.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP_STEPS.map((step) => (
            <div key={step.n} className="card">
              <div className="label-mono text-brand">{step.n}</div>
              <div className="mt-2 text-lg text-ink">{step.name}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Built for both sides */}
      <section className="border-y border-border bg-surface-raised">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <span className="label-mono">Built for both sides</span>
          <h2 className="mt-3 max-w-2xl text-3xl text-ink">
            The first platform that solves the problem for everyone.
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            Every existing hiring tool was built for one side. Dossyr was designed from the start
            for two.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="card">
              <div className="label-mono text-brand">For employers</div>
              <h3 className="mt-2 text-xl text-ink">Shortlist in hours. Not weeks.</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {EMPLOYER_BENEFITS.map((b) => (
                  <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                    <span className="text-brand">•</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <div className="label-mono text-accent">For candidates</div>
              <h3 className="mt-2 text-xl text-ink">
                Prove what you can do.
                <br />
                Own the proof forever.
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {CANDIDATE_BENEFITS.map((b) => (
                  <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                    <span className="text-accent">•</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Create preview */}
          <div className="card mt-8 bg-brand-bg">
            <span className="band-pill-solid">Create</span>
            <h3 className="mt-3 text-2xl text-ink">
              Your work speaks. <span className="italic text-accent">Show them who built it.</span>
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              Dossyr verifies <em>how</em> you think. <strong className="text-ink">Create</strong>{" "}
              lets you show <em>what</em> you&apos;ve made. Attach one artifact — a GitHub repo, a
              live project, a piece of music, a poem, a painting. The choice itself tells
              employers something no test can.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CREATE_TYPES.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-ink"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-4 max-w-xl text-xs leading-relaxed text-muted">
              Your Create artifact appears on your Prooffile — after your verified DMCS signals.
              Not used in scoring. Not ranked. Just you, presented as you choose.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h2 className="text-3xl text-ink">Every hire. Every career.</h2>
        <p className="mt-3 text-muted">
          Finally, the intelligence to get both right — start on whichever side you&apos;re on.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/candidate/signup" className="btn-primary">
            Candidate signup
          </Link>
          <Link href="/employer/signup" className="btn-secondary">
            Employer signup
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-10 text-center">
          <div className="label-mono text-ink">DOSSYR</div>
          <p className="mt-2 text-sm text-muted">
            Every hire. Every career. Finally, the intelligence to get both right.
          </p>
        </div>
      </footer>
    </main>
  );
}
