"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function EmployerSignup() {
  const router = useRouter();
  const supabase = createClient();

  const [companyName, setCompanyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    // Step 2: create the employer account (the company).
    // The id is generated client-side and inserted explicitly, rather than
    // relying on `.select().single()` to read the row back after insert:
    // the only SELECT policy on `employers` requires a matching
    // `employer_seats` row, which doesn't exist until step 3 below, so
    // RETURNING the just-inserted row would always be blocked by RLS.
    const employerId = crypto.randomUUID();
    const { error: employerError } = await supabase
      .from("employers")
      .insert({ id: employerId, company_name: companyName });

    if (employerError) {
      setError(employerError.message);
      setLoading(false);
      return;
    }

    // Step 3: create the first seat under that employer — always admin.
    // Every other seat type gets added later by this admin (PRD 7D.8).
    const { error: seatError } = await supabase.from("employer_seats").insert({
      user_id: authData.user.id,
      employer_id: employerId,
      seat_type: "admin",
      display_name: displayName,
      email,
    });

    if (seatError) {
      setError(seatError.message);
      setLoading(false);
      return;
    }

    router.push("/employer/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="mb-1 text-2xl text-ink">Create your employer account</h1>

        <label className="flex flex-col gap-1.5 text-sm text-ink">
          Company name
          <input
            className="input"
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink">
          Your name
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
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="mt-2 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/employer/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
