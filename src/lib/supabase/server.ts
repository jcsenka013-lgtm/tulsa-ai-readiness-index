import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Uses the public anon key and reads/writes the user's
 * session via Next.js cookies.
 *
 * For admin/service-role work (bypassing RLS), use `createServiceClient`.
 */
export async function createClient() {
  const cookieStore = await cookies();

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
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method is called from a Server Component — this
            // is ignored if a middleware is refreshing user sessions.
          }
        },
      },
    },
  );
}

/**
 * Creates a privileged Supabase client using the service-role key.
 * NEVER import this from a Client Component. Only use it in Route Handlers,
 * Server Actions, or server-only utilities where RLS needs to be bypassed
 * (e.g. writing an anonymous assessment row from the assessment flow).
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Service client does not manage user sessions.
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
