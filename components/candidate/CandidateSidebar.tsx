"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/candidate/dashboard", label: "Overview" },
  { href: "/candidate/prooffile", label: "My Prooffile" },
  { href: "/candidate/settings", label: "Portfolio & Resume" },
];

// Deliberately only lists what's real today - no Signals/Credits/Create/
// Audit-trail/Employer-view nav items, since none of those systems exist
// yet and this codebase has held a strict no-fabrication rule everywhere
// else (verified scores, honest replay timestamps, no invented stats).
export function CandidateSidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-6 border-r border-border bg-surface-raised px-4 py-6">
      <span className="label-mono px-2">Dossyr</span>

      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                active ? "bg-brand-bg text-brand-dark" : "text-muted hover:bg-surface hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        <span className="truncate px-2 text-sm text-ink">{displayName}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md px-2.5 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
