"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CandidateSignup() {
  const router = useRouter();
  const supabase = createClient();

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

    // Step 2: create the matching candidates profile row.
    // id must match auth.users.id — that's the foreign key link in the schema.
    const { error: profileError } = await supabase.from("candidates").insert({
      id: authData.user.id,
      display_name: displayName,
      email,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.push("/candidate/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="mb-1 text-2xl text-ink">Create your Dossyr profile</h1>

        <label className="flex flex-col gap-1.5 text-sm text-ink">
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
          Email
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
          <Link href="/candidate/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
