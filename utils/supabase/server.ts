import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = () => {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        async getAll() {
          const allCookies = await cookieStore;
          return allCookies.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookieStore.then((resolvedCookieStore) => {
              cookiesToSet.forEach(({ name, value, options }) => 
                resolvedCookieStore.set(name, value, options)
              );
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};