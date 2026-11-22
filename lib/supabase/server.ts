import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Supabase client untuk Server Components, Server Actions & Route Handlers.
 * Catatan (cacheComponents aktif): komponen yang memanggil ini membaca cookies,
 * jadi letakkan di dalam <Suspense>.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component — aman diabaikan, sesi di-refresh oleh proxy.ts
        }
      },
    },
  });
}
