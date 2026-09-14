import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Server-side client bound to the request's cookies (RLS enforced as the logged-in user).
 * Use in Server Components, Route Handlers and Server Actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
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
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — ignored because middleware
            // refreshes the session on every request anyway.
          }
        },
      },
    },
  );
}

/**
 * Admin client using the service role key — bypasses RLS.
 * Server-only. Never import this from client components.
 * Use only for trusted backend operations (signed URLs, webhooks, admin tasks).
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must never be called from the browser");
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
