import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used in server components, layouts, and route handlers — anywhere that
// runs on the server and needs to know who the logged-in user is via cookies.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore because
            // middleware refreshes the session on every request anyway.
          }
        },
      },
    }
  );
}
