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
    <main style={styles.main}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.heading}>Create your Dossyr profile</h1>

        <label style={styles.label}>
          Full name
          <input
            style={styles.input}
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <label style={styles.label}>
          Email
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
          Already have an account?{" "}
          <Link href="/candidate/login">Log in</Link>
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
