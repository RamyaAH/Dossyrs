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

    // Step 2: create the employer account (the company)
    const { data: employer, error: employerError } = await supabase
      .from("employers")
      .insert({ company_name: companyName })
      .select()
      .single();

    if (employerError || !employer) {
      setError(employerError?.message ?? "Could not create employer account.");
      setLoading(false);
      return;
    }

    // Step 3: create the first seat under that employer — always admin.
    // Every other seat type gets added later by this admin (PRD 7D.8).
    const { error: seatError } = await supabase.from("employer_seats").insert({
      user_id: authData.user.id,
      employer_id: employer.id,
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
    <main style={styles.main}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.heading}>Create your employer account</h1>

        <label style={styles.label}>
          Company name
          <input
            style={styles.input}
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </label>

        <label style={styles.label}>
          Your name
          <input
            style={styles.input}
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <label style={styles.label}>
          Work email
          <input
            style={styles.input}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label style={styles.label}>
          Password
          <input
            style={styles.input}
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p style={styles.footerText}>
          Already have an account? <Link href="/employer/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  form: {
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  heading: { fontSize: 22, fontWeight: 600, marginBottom: 8 },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 14 },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 15,
  },
  button: {
    marginTop: 8,
    padding: "12px 16px",
    borderRadius: 8,
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: 15,
    cursor: "pointer",
  },
  error: { color: "#c0392b", fontSize: 13 },
  footerText: { fontSize: 13, textAlign: "center", marginTop: 8 },
};
