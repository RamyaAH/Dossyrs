import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>Dossyr</h1>
      <div style={{ display: "flex", gap: 16 }}>
        <Link
          href="/candidate/login"
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "1px solid #ddd",
            textDecoration: "none",
            color: "#111",
          }}
        >
          Candidate Login
        </Link>
        <Link
          href="/employer/login"
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "1px solid #ddd",
            textDecoration: "none",
            color: "#111",
          }}
        >
          Employer Login
        </Link>
      </div>
    </main>
  );
}
