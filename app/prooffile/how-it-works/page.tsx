import Link from "next/link";

// Prooffile Block 5 — a first-class page, not a help article. Content is
// deliberately honest about what this version of Dossyr does and does not
// do yet, rather than describing the full product vision.
export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-brand hover:underline">
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-ink">How is this verified?</h1>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          What the assessment is
        </h2>
        <p className="text-sm leading-relaxed text-ink">
          Candidates complete a fixed set of realistic engineering scenarios — a live
          incident to debug, a sprint to triage under a real capacity constraint, and an
          underspecified request to scope. Every candidate sees the same scenarios in this
          version; there is no adaptive branching yet.
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          What DMCS measures
        </h2>
        <p className="text-sm leading-relaxed text-ink">
          Each scenario response is scored against a fixed, deterministic rubric across five
          dimensions — Technical Ability, Problem Resolution, Information Synthesis,
          Situational Awareness, and Learning &amp; Adaptation Mindset. Scoring is rule-based
          (keyword matches, structural checks, rank correlation), not a machine-learning model,
          and never edited by hand after it's generated.
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          What CIQ checks — and what it doesn&apos;t
        </h2>
        <p className="text-sm leading-relaxed text-ink">
          CIQ is a lightweight integrity signal, not proctoring or machine-learning-based
          detection. It checks a few honest, rule-based heuristics: whether a session was
          completed implausibly fast given how much was written, whether large blocks of text
          were pasted rather than typed, and whether free-text answers across independent
          scenarios are suspiciously similar. A <strong>Clean</strong> status means none of
          those checks triggered. A <strong>Review</strong> status means one did — it is not an
          accusation, and detection thresholds aren&apos;t published so the checks stay
          meaningful.
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          What this version does not include
        </h2>
        <p className="text-sm leading-relaxed text-ink">
          There is no webcam or video evidence capture in this version. There is no adaptive,
          branching simulation engine yet — scenarios are fixed. Outcome badges based on
          post-hire performance don&apos;t exist yet either. Each of these is a deliberate,
          separate phase of work, not an oversight.
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Assessment ID and your control
        </h2>
        <p className="text-sm leading-relaxed text-ink">
          Every completed session gets a unique, permanent Assessment ID. Scores and CIQ
          status are recorded once and never modified after the fact. Your Prooffile link is
          shareable only when and with whom you choose.
        </p>
      </section>
    </main>
  );
}
