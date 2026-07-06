import { createBrowserClient } from "@supabase/ssr";

// Used inside "use client" components — forms, buttons, anything interactive
// that runs in the browser. Reads the public (safe to expose) Supabase keys.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
